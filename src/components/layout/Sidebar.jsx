import React, { useState } from 'react';
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
    BarChart3
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const { hasPermission } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(null);

    const preventLinkDrag = (event) => {
        event.preventDefault();
    };

    const menuItems = [
        { path: '/dashboard', name: 'Inicio', icon: <Home size={18} />, permission: null },
        { path: '/panel-control', name: 'Panel de Control', icon: <BarChart3 size={18} />, permission: 'ver_dashboard' },
        { path: '/reportes', name: 'Reportes', icon: <FileText size={18} />, permission: 'ver_reportes' },
        { path: '/productos', name: 'Inventario', icon: <Package size={18} />, permission: 'ver_inventario' },
        { path: '/categorias', name: 'Categorias', icon: <Tags size={18} />, permission: 'ver_categorias' },
        { path: '/clientes', name: 'Clientes', icon: <Users size={18} />, permission: 'ver_clientes' },
        { path: '/proveedores', name: 'Proveedores', icon: <Truck size={18} />, permission: 'ver_proveedores' },
        { path: '/ventas', name: 'Ventas', icon: <ShoppingCart size={18} />, permission: 'crear_ventas' },
        { path: '/movimientos', name: 'Movimientos', icon: <ArrowLeftRight size={18} />, permission: 'ver_movimientos' },
        { path: '/gastos', name: 'Gastos', icon: <Receipt size={18} />, permission: 'ver_gastos' },
        { path: '/compras', name: 'Compras', icon: <Briefcase size={18} />, permission: 'ver_compras' },
        { path: '/creditos', name: 'Creditos', icon: <BadgeDollarSign size={18} />, permission: 'ver_creditos' },
        { path: '/usuarios', name: 'Usuarios', icon: <Shield size={18} />, permission: 'ver_usuarios' },
        { path: '/auditoria', name: 'Auditoria', icon: <ClipboardList size={18} />, permission: 'ver_auditoria' }
    ];

    const rolesDropdown = {
        name: 'Roles y Permisos',
        icon: <ShieldCheck size={18} />,
        permission: 'ver_roles',
        children: [
            { path: '/roles', name: 'Roles', icon: <ShieldCheck size={16} /> },
            { path: '/permisos', name: 'Permisos', icon: <Key size={16} /> }
        ]
    };

    const visibleItems = menuItems.filter((item) =>
        item.permission === null || hasPermission(item.permission)
    );

    const showRolesDropdown = hasPermission(rolesDropdown.permission);
    const isDropdownActive = rolesDropdown.children.some((child) => location.pathname === child.path);

    const toggleDropdown = () => {
        setOpenDropdown((prev) => prev === 'roles' ? null : 'roles');
    };

    React.useEffect(() => {
        if (isDropdownActive) {
            setOpenDropdown('roles');
        }
    }, [isDropdownActive]);

    return (
        <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <ul className="sidebar-nav">
                {visibleItems.map((item) => (
                    <li key={item.path}>
                        <Link
                            to={item.path}
                            className={location.pathname === item.path ? 'active' : ''}
                            draggable={false}
                            onDragStart={preventLinkDrag}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    </li>
                ))}

                {showRolesDropdown && (
                    <li>
                        <a
                            href="#"
                            className={isDropdownActive ? 'active' : ''}
                            onClick={(event) => {
                                event.preventDefault();
                                toggleDropdown();
                            }}
                            draggable={false}
                            onDragStart={preventLinkDrag}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {rolesDropdown.icon}
                                <span>{rolesDropdown.name}</span>
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
                            {rolesDropdown.children.map((child) => (
                                <li key={child.path}>
                                    <Link
                                        to={child.path}
                                        className={location.pathname === child.path ? 'active' : ''}
                                        draggable={false}
                                        onDragStart={preventLinkDrag}
                                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                                    >
                                        {child.icon}
                                        <span>{child.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                )}
            </ul>
        </aside>
    );
};

export default Sidebar;
