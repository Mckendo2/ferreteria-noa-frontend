import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import {
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
    ClipboardList,
    FileText,
    Home,
    BarChart3,
    GripVertical
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(null);

    // Drag state (desktop only)
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const dragNodeRef = useRef(null);

    // Per-user storage key
    const storageKey = user ? `sidebar_order_${user.id}` : 'sidebar_order';

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

    // Load saved order from localStorage (per-user)
    const getSavedOrder = () => {
        try {
            const saved = localStorage.getItem(storageKey);
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
                // New modules go at the end
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

    // Persist order to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(orderedItems.map(i => i.id)));
    }, [orderedItems, storageKey]);

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
    const reorder = (fromIdx, toIdx) => {
        if (fromIdx === toIdx) return;
        const fromItem = visibleItems[fromIdx];
        const toItem = visibleItems[toIdx];
        if (!fromItem || !toItem) return;
        const fullFromIdx = orderedItems.indexOf(fromItem);
        const fullToIdx = orderedItems.indexOf(toItem);
        if (fullFromIdx === -1 || fullToIdx === -1) return;
        const newItems = [...orderedItems];
        const [moved] = newItems.splice(fullFromIdx, 1);
        newItems.splice(fullToIdx, 0, moved);
        setOrderedItems(newItems);
    };

    // ─── Desktop Drag & Drop (HTML5 API) ───
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
        if (overIndex !== idx) setOverIndex(idx);
    };

    const handleDragEnter = (e, idx) => {
        e.preventDefault();
        if (overIndex !== idx) setOverIndex(idx);
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

    const resetDragState = () => {
        if (dragNodeRef.current) {
            dragNodeRef.current.classList.remove('dragging');
        }
        setDragIndex(null);
        setOverIndex(null);
        dragNodeRef.current = null;
    };

    const preventLinkDrag = (e) => e.preventDefault();

    const getItemClass = (idx) => {
        let cls = 'sidebar-draggable-item';
        if (dragIndex === idx) cls += ' drag-source';
        if (overIndex === idx && dragIndex !== idx) cls += ' drag-over';
        return cls;
    };

    const handleNavClick = (path) => {
        navigate(path);
    };

    // ─── Render menu item ───
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
        >
            <div className="drag-handle" aria-label="Arrastrar para reordenar">
                <GripVertical size={14} />
            </div>
            <div
                className={`sidebar-link${location.pathname === item.path ? ' active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNavClick(item.path); }}
                draggable={false}
                onDragStart={preventLinkDrag}
            >
                {item.icon}
                <span>{item.name}</span>
            </div>
        </li>
    );

    // ─── Render dropdown item ───
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
            >
                <div className="drag-handle" aria-label="Arrastrar para reordenar">
                    <GripVertical size={14} />
                </div>
                <div
                    className={`sidebar-link${dropdownActive ? ' active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleDropdown();
                    }}
                    role="button"
                    tabIndex={0}
                    draggable={false}
                    onDragStart={preventLinkDrag}
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
                </div>
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
                            <div
                                className={`sidebar-link${location.pathname === child.path ? ' active' : ''}`}
                                onClick={() => handleNavClick(child.path)}
                                role="link"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleNavClick(child.path); }}
                                style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                            >
                                {child.icon}
                                <span>{child.name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </li>
        );
    };

    return (
        <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <ul className="sidebar-nav" ref={sidebarNavRef => {}}>
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
