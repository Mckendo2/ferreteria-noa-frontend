import { useState, useEffect, useCallback } from 'react';
import * as providerService from '../services/providerService';
import Swal from 'sweetalert2';

const useProviders = () => {
    const [providers, setProviders] = useState([]);
    const [allProviders, setAllProviders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchProviders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await providerService.getProviders();
            setAllProviders(data);
            setProviders(data);
        } catch (err) {
            console.error('Error fetching providers:', err);
            setError('Error al cargar proveedores');
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al cargar los proveedores.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    // Handle search
    useEffect(() => {
        let result = allProviders;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(provider => 
                (provider.nombre && provider.nombre.toLowerCase().includes(term)) ||
                (provider.email && provider.email.toLowerCase().includes(term)) ||
                (provider.telefono && provider.telefono.includes(term)) ||
                (provider.direccion && provider.direccion.toLowerCase().includes(term))
            );
        }

        setProviders(result);
        setCurrentPage(1);
    }, [searchTerm, allProviders]);

    const handleCreate = async (providerData) => {
        try {
            await providerService.createProvider(providerData);
            Swal.fire({
                title: '¡Creado!',
                text: 'El proveedor ha sido registrado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
            fetchProviders();
            return true;
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'Hubo un problema al crear el proveedor.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return false;
        }
    };

    const handleUpdate = async (id, providerData) => {
        try {
            await providerService.updateProvider(id, providerData);
            Swal.fire({
                title: '¡Actualizado!',
                text: 'El proveedor ha sido actualizado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
            fetchProviders();
            return true;
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'Hubo un problema al actualizar el proveedor.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return false;
        }
    };

    const handleToggleStatus = async (provider) => {
        const isActivating = !provider.activo;
        const result = await Swal.fire({
            title: isActivating ? '¿Reactivar proveedor?' : '¿Desactivar proveedor?',
            text: isActivating 
                ? "El proveedor volverá a estar disponible para el sistema."
                : "Se ocultará el proveedor pero se mantendrán sus registros.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isActivating ? '#00CA72' : '#0070F3',
            cancelButtonColor: '#E00',
            confirmButtonText: isActivating ? 'Sí, reactivar' : 'Sí, desactivar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm', cancelButton: 'my-swal-cancel' }
        });

        if (result.isConfirmed) {
            try {
                await providerService.toggleProviderStatus(provider.id);
                Swal.fire({
                    title: isActivating ? '¡Reactivado!' : '¡Desactivado!',
                    text: `El proveedor ha sido ${isActivating ? 'reactivado' : 'desactivado'}.`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
                fetchProviders();
            } catch (error) {
                console.error('Error toggling provider status:', error);
                Swal.fire({
                    title: 'Error',
                    text: `Hubo un problema al ${isActivating ? 'reactivar' : 'desactivar'} el proveedor.`,
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
    const totalPages = Math.ceil(providers.length / itemsPerPage) || 1;
    const paginatedProviders = providers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return {
        providers: paginatedProviders,
        allProviders,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleCreate,
        handleUpdate,
        handleToggleStatus,
        handleClearFilters,
        fetchProviders,
    };
};

export default useProviders;
