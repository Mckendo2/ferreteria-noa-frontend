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
const LONG_PRESS_MS = 1200; // 1.2 seconds to activate drag on mobile
const MOVE_THRESHOLD = 8; // px of movement allowed during long-press

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const { hasPermission } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(null);

    // Drag state
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const [touchDragActive, setTouchDragActive] = useState(false);
    const dragNodeRef = useRef(null);
    const sidebarNavRef = useRef(null);
    const ghostRef = useRef(null);

    // Long-press refs
    const longPressTimer = useRef(null);
    const touchOrigin = useRef({ x: 0, y: 0 });
    const touchDragActiveRef = useRef(false); // mirror for event handlers (no stale closure)
    const rafRef = useRef(null);
    const cachedRects = useRef([]); // cache item positions for perf

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

    // Load saved order from localStorage
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

    // ─── Reorder helper ───
    const reorder = useCallback((fromIdx, toIdx) => {
        if (fromIdx === toIdx) return;
        const fromItem = visibleItems[fromIdx];
        const toItem = visibleItems[toIdx];
        const fullFromIdx = orderedItems.indexOf(fromItem);
        const fullToIdx = orderedItems.indexOf(toItem);
        if (fullFromIdx === -1 || fullToIdx === -1) return;
        const newItems = [...orderedItems];
        const [moved] = newItems.splice(fullFromIdx, 1);
        newItems.splice(fullToIdx, 0, moved);
        setOrderedItems(newItems);
    }, [visibleItems, orderedItems]);

    // ─── Desktop Drag & Drop (HTML5) ───
    const handleDragStart = (e, idx) => {
        setDragIndex(idx);
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
        if (idx !== overIndex) setOverIndex(idx);
    };

    const handleDragEnter = (e, idx) => {
        e.preventDefault();
        if (idx !== overIndex) setOverIndex(idx);
    };

    const handleDrop = (e, idx) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== idx) {
            reorder(dragIndex, idx);
        }
        resetDragState();
    };

    const handleDragEnd = () => {
        resetDragState();
    };

    // ─── Touch: Long-press to activate drag (Mobile) ───
    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const activateTouchDrag = (idx, targetEl) => {
        // Vibrate for haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);

        touchDragActiveRef.current = true;
        setTouchDragActive(true);
        setDragIndex(idx);

        // Cache all item rects for fast hit-testing during move
        if (sidebarNavRef.current) {
            const items = sidebarNavRef.current.querySelectorAll('.sidebar-draggable-item');
            cachedRects.current = Array.from(items).map(el => el.getBoundingClientRect());
        }

        // Create ghost
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
                will-change: transform;
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

        // Get the item element for later use
        const target = e.target.closest('.sidebar-draggable-item');

        // Start long-press timer — only activates after LONG_PRESS_MS
        cancelLongPress();
        longPressTimer.current = setTimeout(() => {
            activateTouchDrag(idx, target);
        }, LONG_PRESS_MS);
    };

    const handleTouchMove = (e) => {
        const touch = e.touches[0];

        // If drag NOT active yet, check if finger moved too far → cancel long-press
        if (!touchDragActiveRef.current) {
            const dx = Math.abs(touch.clientX - touchOrigin.current.x);
            const dy = Math.abs(touch.clientY - touchOrigin.current.y);
            if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
                cancelLongPress();
                // Let the browser handle the scroll normally
            }
            return; // Do NOT preventDefault → scroll works normally
        }

        // ─── Drag IS active ───
        e.preventDefault(); // block scroll only when dragging

        // Use rAF to throttle DOM updates for smooth movement
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            // Move ghost
            if (ghostRef.current) {
                const ghostHeight = ghostRef.current.offsetHeight;
                ghostRef.current.style.top = `${touch.clientY - ghostHeight / 2}px`;
            }

            // Hit-test against cached rects (fast, no layout thrash)
            const rects = cachedRects.current;
            for (let i = 0; i < rects.length; i++) {
                if (touch.clientY >= rects[i].top && touch.clientY <= rects[i].bottom) {
                    setOverIndex(i);
                    break;
                }
            }
        });
    };

    const handleTouchEnd = () => {
        cancelLongPress();

        if (touchDragActiveRef.current && dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
            reorder(dragIndex, overIndex);
        }

        resetDragState();
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
        setDragIndex(null);
        setOverIndex(null);
        dragNodeRef.current = null;
        cachedRects.current = [];
    };

    // Cleanup on unmount
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

    // Build touch handlers — touchMove & touchEnd on the UL so they work even when finger leaves original item
    const touchItemHandlers = (idx) => ({
        onTouchStart: (e) => handleTouchStart(e, idx),
    });

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
            {...touchItemHandlers(idx)}
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
                {...touchItemHandlers(idx)}
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
            <ul
                className="sidebar-nav"
                ref={sidebarNavRef}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
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
