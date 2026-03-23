import { useState, useEffect, useMemo } from 'react';
import { getCategories, toggleCategoryStatus } from '../services/categoryService';
import Swal from 'sweetalert2';

const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const processedCategories = useMemo(() => {
        let result = [...categories];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                (c.nombre?.toLowerCase?.() || '').includes(term) ||
                (c.descripcion?.toLowerCase?.() || '').includes(term)
            );
        }

        result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        return result;
    }, [categories, searchTerm]);

    const totalPages = Math.max(1, Math.ceil((processedCategories?.length || 0) / itemsPerPage));
    const currentCategories = processedCategories?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) || [];

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleToggleStatus = async (category) => {
        const isActivating = !category.activo;
        const result = await Swal.fire({
            title: isActivating ? '¿Reactivar categoría?' : '¿Desactivar categoría?',
            text: isActivating 
                ? "La categoría volverá a estar disponible para productos."
                : "Los productos asociados podrían quedarse sin categoría activa.",
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
                await toggleCategoryStatus(category.id);
                Swal.fire({
                    title: isActivating ? 'Reactivada!' : 'Desactivada!', 
                    text: `La categoría ha sido ${isActivating ? 'reactivada' : 'desactivada'}.`, 
                    icon: 'success',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
                fetchCategories();
            } catch (error) {
                Swal.fire({
                    title: 'Error', 
                    text: `No se pudo ${isActivating ? 'reactivar' : 'desactivar'} la categoría.`, 
                    icon: 'error',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
            }
        }
    };

    return {
        categories: currentCategories,
        allCategories: processedCategories,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleToggleStatus,
        fetchCategories,
    };
};

export default useCategories;
