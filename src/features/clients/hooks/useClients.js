import { useState, useEffect, useCallback } from 'react';
import * as clientService from '../services/clientService';
import Swal from 'sweetalert2';

const useClients = () => {
    const [clients, setClients] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await clientService.getClients();
            // Assuming active clients or we filter by activo
            setAllClients(data);
            setClients(data);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Error al cargar clientes');
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al cargar los clientes.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Handle search
    useEffect(() => {
        let result = allClients;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(client => 
                (client.nombre && client.nombre.toLowerCase().includes(term)) ||
                (client.email && client.email.toLowerCase().includes(term)) ||
                (client.telefono && client.telefono.includes(term)) ||
                (client.direccion && client.direccion.toLowerCase().includes(term))
            );
        }

        setClients(result);
        setCurrentPage(1);
    }, [searchTerm, allClients]);

    const handleCreate = async (clientData) => {
        try {
            await clientService.createClient(clientData);
            Swal.fire({
                title: '¡Creado!',
                text: 'El cliente ha sido registrado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
            fetchClients();
            return true;
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'Hubo un problema al crear el cliente.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return false;
        }
    };

    const handleUpdate = async (id, clientData) => {
        try {
            await clientService.updateClient(id, clientData);
            Swal.fire({
                title: '¡Actualizado!',
                text: 'El cliente ha sido actualizado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
            fetchClients();
            return true;
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'Hubo un problema al actualizar el cliente.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return false;
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "El cliente será desactivado del sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'my-swal-bg',
                confirmButton: 'my-swal-confirm',
                cancelButton: 'my-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                // Delete typically means making it inactive or soft delete
                await clientService.deleteClient(id);
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El cliente ha sido eliminado.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
                fetchClients(); // Refresh list
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al eliminar el cliente.',
                    icon: 'error',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
            }
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
    };

    // Calculate pagination
    const totalPages = Math.ceil(clients.length / itemsPerPage) || 1;
    const paginatedClients = clients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return {
        clients: paginatedClients,
        allClients,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleClearFilters,
        fetchClients,
    };
};

export default useClients;
