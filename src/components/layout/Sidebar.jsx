import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import {
    LayoutDashboard,
    Package,
    Tags,
    Users,
    Truck,
    ShoppingCart,
    Briefcase,
    Shield,
    ShieldCheck,
    ArrowLeftRight,
    Receipt,
    BadgeDollarSign,
    ChevronDown,
    Key,
    Keyboard,
    ClipboardList,
    FileText,
    Home,
    BarChart3,
    GripVertical
} from 'lucide-react';

const STORAGE_KEY = 'sidebar_order';
const LONG_PRESS_MS = 1200;
const MOVE_THRESHOLD = 10;

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const { hasPermission } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(null);

    // Drag visual state (for re-render)
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const [touchDragActive, setTouchDragActive] = useState(false);

    // Refs that event handlers read (avoid stale closures)
    const dragIndexRef = useRef(null);
    const overIndexRef = useRef(null);
    const touchDragActiveRef = useRef(false);
    const dragNodeRef = useRef(null);
    const sidebarNavRef = useRef(null);
    const ghostRef = useRef(null);
    const longPressTimer = useRef(null);
    const touchOrigin = useRef({ x: 0, y: 0 });
    const rafRef = useRef(null);
    const cachedRects = useRef([]);
    const reorderRef = useRef(null); // will hold latest reorder fn

    const allMenuItems = [
        { id: 'inicio', path: '/dashboard', name: 'Inicio', icon: <Home size={18} />, permission: null },
        { id: 'panel', path: '/panel-control', name: 'Panel de Control', icon: <BarChart3 size={18} />, permission: 'ver_dashboard' },
        { id: 'reportes', path: '/reportes', name: 'Reportes', icon: <FileText size={18} />, permission: 'ver_reportes' },
        { id: 'inventario', path: '/productos', name: 'Inventario', icon: <Package size={18} />, permission: 'ver_inventario' },
        { id: 'categorias', path: '/categorias', name: 'Categorias', icon: <Tags size={18} />, permission: 'ver_categorias' },
        { id: 'clientes', path: '/clientes', name: 'Clientes', icon: <Users size={18} />, permission: 'ver_clientes' },
        { id: 'proveedores', path: '/proveedores', name: 'Proveedores', icon: <Truck size={18} />, permission: 'ver_proveedores' },
        { id: 'ventas', path: '/ventas', name: 'Ventas', icon: <ShoppingCart size={18} />, permission: 'crear_ventas' },
        { id: 'movimientos', path: '/movimientos', name: 'Movimientos', icon: <ArrowLeftRight size={18} />, permission: 'ver_movimientos' },
        { id: 'gastos', path: '/gastos', name: 'Gastos', icon: <Receipt size={18} />, permission: 'ver_gastos' },
        { id: 'compras', path: '/compras', name: 'Compras', icon: <Briefcase size={18} />, permission: 'ver_compras' },
        { id: 'creditos', path: '/creditos', name: 'Creditos', icon: <BadgeDollarSign size={18} />, permission: 'ver_creditos' },
        { id: 'usuarios', path: '/usuarios', name: 'Usuarios', icon: <Shield size={18} />, permission: 'ver_usuarios' },
        { id: 'auditoria', path: '/auditoria', name: 'Auditoria', icon: <ClipboardList size={18} />, permission: 'ver_auditoria' },
        {
            id: 'roles_permisos',
            name: 'Roles y Permisos',
            icon: <ShieldCheck size={18} />,
            permission: 'ver_roles',
            isDropdown: true,
            children: [
                { path: '/roles', name: 'Roles', icon: <ShieldCheck size={16} /> },
                { path: '/permisos', name: 'Permisos', icon: <Key size={16} /> }
            ]
        }
    ];

    const getSavedOrder = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const orderIds = JSON.parse(saved);
                const itemMap = {};
                allMenuItems.forEach(item => { itemMap[item.id] = item; });
                const ordered = [];
                orderIds.forEach(id => {
                    if (itemMap[id]) {
                        ordered.push(itemMap[id]);
                        delete itemMap[id];
                    }
                });
                Object.values(itemMap).forEach(item => ordered.push(item));
                return ordered;
            }
        } catch { /* ignore */ }
        return allMenuItems;
    };

    const [orderedItems, setOrderedItems] = useState(getSavedOrder);

    const visibleItems = orderedItems.filter(item =>
        item.permission === null || hasPermission(item.permission)
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orderedItems.map(i => i.id)));
    }, [orderedItems]);

    const isDropdownActive = (item) => {
        if (!item.isDropdown) return false;
        return item.children.some(child => location.pathname === child.path);
    };

    const toggleDropdown = () => {
        setOpenDropdown(prev => prev === 'roles' ? null : 'roles');
    };

    useEffect(() => {
        const rolesItem = orderedItems.find(i => i.id === 'roles_permisos');
        if (rolesItem && isDropdownActive(rolesItem)) {
            setOpenDropdown('roles');
        }
    }, [location.pathname]);

    // ─── Reorder ───
    const reorder = useCallback((fromIdx, toIdx) => {
        if (fromIdx === toIdx) return;
        setOrderedItems(prev => {
            const vis = prev.filter(item =>
                item.permission === null || hasPermission(item.permission)
            );
            const fromItem = vis[fromIdx];
            const toItem = vis[toIdx];
            const fullFromIdx = prev.indexOf(fromItem);
            const fullToIdx = prev.indexOf(toItem);
            if (fullFromIdx === -1 || fullToIdx === -1) return prev;
            const newItems = [...prev];
            const [moved] = newItems.splice(fullFromIdx, 1);
            newItems.splice(fullToIdx, 0, moved);
            return newItems;
        });
    }, [hasPermission]);

    // Keep reorder ref current
    reorderRef.current = reorder;

    // Helper to sync ref + state
    const setDragIdx = (val) => { dragIndexRef.current = val; setDragIndex(val); };
    const setOverIdx = (val) => { overIndexRef.current = val; setOverIndex(val); };

    // ─── Desktop Drag & Drop (HTML5) ───
    const handleDragStart = (e, idx) => {
        setDragIdx(idx);
        dragNodeRef.current = e.target.closest('.sidebar-draggable-item');
        e.dataTransfer.effectAllowed = 'move';
        if (dragNodeRef.current) {
            e.dataTransfer.setDragImage(dragNodeRef.current, 0, 0);
        }
        setTimeout(() => {
            if (dragNodeRef.current) dragNodeRef.current.classList.add('dragging');
        }, 0);
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIdx(idx);
    };

    const handleDragEnter = (e, idx) => {
        e.preventDefault();
        setOverIdx(idx);
    };

    const handleDrop = (e, idx) => {
        e.preventDefault();
        if (dragIndexRef.current !== null && dragIndexRef.current !== idx) {
            reorder(dragIndexRef.current, idx);
        }
        resetDragState();
    };

    const handleDragEnd = () => {
        resetDragState();
    };

    // ─── Touch: Long-press to activate (Mobile) ───
    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const activateTouchDrag = (idx, targetEl) => {
        if (navigator.vibrate) navigator.vibrate(50);

        touchDragActiveRef.current = true;
        setTouchDragActive(true);
        setDragIdx(idx);

        // Cache rects once for fast hit-testing
        if (sidebarNavRef.current) {
            const items = sidebarNavRef.current.querySelectorAll('.sidebar-draggable-item');
            cachedRects.current = Array.from(items).map(el => {
                const r = el.getBoundingClientRect();
                return { top: r.top, bottom: r.bottom };
            });
        }

        // Create ghost clone
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const ghost = targetEl.cloneNode(true);
            ghost.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                opacity: 0.9;
                z-index: 9999;
                pointer-events: none;
                box-shadow: 0 8px 32px rgba(0,0,0,0.35);
                border-radius: 8px;
                background: var(--bg-card);
                border: 2px solid var(--primary-blue, #0070F3);
                will-change: top;
                transition: none;
            `;
            ghost.classList.add('drag-ghost');
            document.body.appendChild(ghost);
            ghostRef.current = ghost;

            targetEl.classList.add('dragging');
            dragNodeRef.current = targetEl;
        }
    };

    const handleTouchStart = (e, idx) => {
        const touch = e.touches[0];
        touchOrigin.current = { x: touch.clientX, y: touch.clientY };

        const target = e.target.closest('.sidebar-draggable-item');

        cancelLongPress();
        longPressTimer.current = setTimeout(() => {
            activateTouchDrag(idx, target);
        }, LONG_PRESS_MS);
    };

    const resetDragState = () => {
        cancelLongPress();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (dragNodeRef.current) {
            dragNodeRef.current.classList.remove('dragging');
        }
        if (ghostRef.current) {
            ghostRef.current.remove();
            ghostRef.current = null;
        }
        touchDragActiveRef.current = false;
        setTouchDragActive(false);
        setDragIdx(null);
        setOverIdx(null);
        dragNodeRef.current = null;
        cachedRects.current = [];
    };

    // ─── Native touchmove/touchend listeners (passive: false) ───
    useEffect(() => {
        const el = sidebarNavRef.current;
        if (!el) return;

        const onTouchMove = (e) => {
            const touch = e.touches[0];

            // If not yet dragging, check movement to cancel long-press
            if (!touchDragActiveRef.current) {
                const dx = Math.abs(touch.clientX - touchOrigin.current.x);
                const dy = Math.abs(touch.clientY - touchOrigin.current.y);
                if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
                    cancelLongPress();
                }
                return; // allow normal scroll
            }

            // ─── Drag IS active → prevent scroll ───
            e.preventDefault();
            e.stopPropagation();

            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                // Move ghost
                if (ghostRef.current) {
                    const gh = ghostRef.current.offsetHeight;
                    ghostRef.current.style.top = `${touch.clientY - gh / 2}px`;
                }

                // Hit-test cached rects
                const rects = cachedRects.current;
                for (let i = 0; i < rects.length; i++) {
                    if (touch.clientY >= rects[i].top && touch.clientY <= rects[i].bottom) {
                        if (overIndexRef.current !== i) {
                            overIndexRef.current = i;
                            setOverIndex(i);
                        }
                        break;
                    }
                }
            });
        };

        const onTouchEnd = () => {
            cancelLongPress();

            if (touchDragActiveRef.current) {
                const from = dragIndexRef.current;
                const to = overIndexRef.current;
                if (from !== null && to !== null && from !== to) {
                    reorderRef.current(from, to);
                }
            }

            resetDragState();
        };

        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd);
        el.addEventListener('touchcancel', onTouchEnd);

        return () => {
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchEnd);
        };
    }, []); // empty deps — uses refs, not state

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            cancelLongPress();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const getItemClass = (idx) => {
        let cls = 'sidebar-draggable-item';
        if (dragIndex === idx) cls += ' drag-source';
        if (overIndex === idx && dragIndex !== idx) cls += ' drag-over';
        return cls;
    };

    // Render a normal menu item
    const renderMenuItem = (item, idx) => (
        <li
            key={item.id}
            className={getItemClass(idx)}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnter={(e) => handleDragEnter(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, idx)}
        >
            <div className="drag-handle" aria-label="Arrastrar para reordenar">
                <GripVertical size={14} />
            </div>
            <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
            >
                {item.icon}
                <span>{item.name}</span>
            </Link>
        </li>
    );

    // Render the dropdown item (Roles y Permisos)
    const renderDropdownItem = (item, idx) => {
        const dropdownActive = isDropdownActive(item);
        return (
            <li
                key={item.id}
                className={getItemClass(idx)}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, idx)}
            >
                <div className="drag-handle" aria-label="Arrastrar para reordenar">
                    <GripVertical size={14} />
                </div>
                <a
                    href="#"
                    className={dropdownActive ? 'active' : ''}
                    onClick={(event) => {
                        event.preventDefault();
                        toggleDropdown();
                    }}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.icon}
                        <span>{item.name}</span>
                    </span>
                    <ChevronDown
                        size={16}
                        style={{
                            transition: 'transform 0.3s ease',
                            transform: openDropdown === 'roles' ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                    />
                </a>
                <ul
                    className="sidebar-dropdown"
                    style={{
                        maxHeight: openDropdown === 'roles' ? '200px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                        paddingLeft: '1.5rem',
                        listStyle: 'none',
                        margin: 0
                    }}
                >
                    {item.children.map((child) => (
                        <li key={child.path}>
                            <Link
                                to={child.path}
                                className={location.pathname === child.path ? 'active' : ''}
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                                style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                            >
                                {child.icon}
                                <span>{child.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </li>
        );
    };

    return (
        <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <ul className="sidebar-nav" ref={sidebarNavRef}>
                {visibleItems.map((item, idx) =>
                    item.isDropdown
                        ? renderDropdownItem(item, idx)
                        : renderMenuItem(item, idx)
                )}
            </ul>
        </aside>
    );
};

export default Sidebar;
