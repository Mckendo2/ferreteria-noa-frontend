import { useState, useEffect, useCallback } from 'react';
import roleService from '../services/roleService';
import Swal from 'sweetalert2';

const useRole = () => {
    const [roles, setRoles] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await roleService.getAll();
            setAllRoles(data);
            applyFilters(data, searchTerm, currentPage);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al cargar los roles'
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage]);

    const applyFilters = (rolesList, search, page) => {
        // Filtrar por término de búsqueda
        let filtered = rolesList;
        if (search) {
            filtered = rolesList.filter(role =>
                role.nombre.toLowerCase().includes(search.toLowerCase()) ||
                (role.descripcion && role.descripcion.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Calcular paginación
        const total = filtered.length;
        setTotalPages(Math.ceil(total / itemsPerPage));

        // Aplicar paginación
        const start = (page - 1) * itemsPerPage;
        const paginated = filtered.slice(start, start + itemsPerPage);
        setRoles(paginated);
    };

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    useEffect(() => {
        if (allRoles.length > 0) {
            applyFilters(allRoles, searchTerm, currentPage);
        }
    }, [searchTerm, currentPage, allRoles]);

    const handleDelete = async (id, roleName) => {
        const result = await Swal.fire({
            title: '¿Eliminar rol?',
            text: `¿Estás seguro de eliminar el rol "${roleName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await roleService.delete(id);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Rol eliminado correctamente',
                    timer: 1500
                });
                fetchRoles();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al eliminar el rol'
                });
            }
        }
    };

    const handleDesactivar = async (id, roleName) => {
        const result = await Swal.fire({
            title: '¿Desactivar rol?',
            text: `¿Estás seguro de desactivar el rol "${roleName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await roleService.desactivar(id);
                Swal.fire({
                    icon: 'success',
                    title: 'Desactivado',
                    text: 'Rol desactivado correctamente',
                    timer: 1500
                });
                fetchRoles();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al desactivar el rol'
                });
            }
        }
    };

    const handleActivar = async (id, roleName) => {
        const result = await Swal.fire({
            title: '¿Activar rol?',
            text: `¿Estás seguro de activar el rol "${roleName}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, activar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await roleService.activar(id);
                Swal.fire({
                    icon: 'success',
                    title: 'Activado',
                    text: 'Rol activado correctamente',
                    timer: 1500
                });
                fetchRoles();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al activar el rol'
                });
            }
        }
    };

    return {
        roles,
        allRoles,
        loading,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleDelete,
        handleDesactivar,
        handleActivar,
        fetchRoles
    };
};

export default useRole;