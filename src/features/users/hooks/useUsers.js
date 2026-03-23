import { useState, useEffect, useMemo } from 'react';
import { getUsers, deleteUser as deleteUserApi, getRoles, updateUser as updateUserApi } from '../services/userService';
import Swal from 'sweetalert2';

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const data = await getRoles();
            setRoles(data.map(r => ({ value: r.id, label: r.nombre, descripcion: r.descripcion })));
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const processedUsers = useMemo(() => {
        let result = [...users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u =>
                (u.nombre?.toLowerCase() || '').includes(term) ||
                (u.email?.toLowerCase() || '').includes(term) ||
                (u.ci?.toLowerCase() || '').includes(term) ||
                (u.telefono?.toLowerCase() || '').includes(term)
            );
        }

        if (selectedRole && selectedRole.value !== 'all') {
            result = result.filter(u => u.rol_id === selectedRole.value);
        }

        return result;
    }, [users, searchTerm, selectedRole]);

    const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
    const currentUsers = processedUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRole]);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'El usuario se marcará como inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0070F3',
            cancelButtonColor: '#E00',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm', cancelButton: 'my-swal-cancel' }
        });

        if (result.isConfirmed) {
            try {
                await deleteUserApi(id);
                Swal.fire({
                    title: 'Eliminado!', text: 'El usuario ha sido eliminado.', icon: 'success',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
                fetchUsers();
            } catch (error) {
                Swal.fire({
                    title: 'Error', text: 'No se pudo eliminar el usuario.', icon: 'error',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
            }
        }
    };

    const handleUpdate = async (id, userData) => {
        try {
            await updateUserApi(id, userData);
            Swal.fire({
                title: 'Actualizado!', text: 'El usuario ha sido actualizado.', icon: 'success',
                timer: 1500, showConfirmButton: false,
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            fetchUsers();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'No se pudo actualizar el usuario.';
            Swal.fire({
                title: 'Error', text: errorMsg, icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        }
    };

    return {
        users: currentUsers,
        allUsers: processedUsers,
        roles,
        searchTerm,
        setSearchTerm,
        selectedRole,
        setSelectedRole,
        currentPage,
        setCurrentPage,
        totalPages,
        handleDelete,
        handleUpdate,
        fetchUsers,
    };
};

export default useUsers;
