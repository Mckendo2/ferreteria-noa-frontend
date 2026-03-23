import { useState, useEffect, useMemo } from 'react';
import { getProducts, deleteProduct as deleteProductApi } from '../services/productService';
import { getCategories } from '../../categories/services/categoryService';
import Swal from 'sweetalert2';

const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSort, setSelectedSort] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data.map(c => ({ value: c.id, label: c.nombre })));
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const sortOptions = [
        { value: 'name_asc', label: 'Alfabético A-Z' },
        { value: 'name_desc', label: 'Alfabético Z-A' },
        { value: 'price_asc', label: 'Precio (menor a mayor)' },
        { value: 'price_desc', label: 'Precio (mayor a menor)' },
        { value: 'stock_asc', label: 'Stock (menor a mayor)' }
    ];

    const processedProducts = useMemo(() => {
        let result = [...products];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                (p.nombre?.toLowerCase?.() || '').includes(term) ||
                (p.codigo_barras?.toLowerCase?.() || '').includes(term)
            );
        }

        if (selectedCategory && selectedCategory.value !== 'all') {
            result = result.filter(p => p.categoria_id === selectedCategory.value);
        }

        if (selectedSort) {
            switch (selectedSort.value) {
                case 'name_asc':
                    result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
                    break;
                case 'name_desc':
                    result.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
                    break;
                case 'price_asc':
                    result.sort((a, b) => a.precio_venta - b.precio_venta);
                    break;
                case 'price_desc':
                    result.sort((a, b) => b.precio_venta - a.precio_venta);
                    break;
                case 'stock_asc':
                    result.sort((a, b) => a.stock - b.stock);
                    break;
                default:
                    break;
            }
        }

        return result;
    }, [products, searchTerm, selectedCategory, selectedSort]);

    const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
    const currentProducts = processedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedSort]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory(null);
        setSelectedSort(null);
    };

    const hasActiveFilters = searchTerm || selectedCategory || selectedSort;

    return {
        products: currentProducts,
        allProducts: processedProducts,
        categories,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedSort,
        setSelectedSort,
        sortOptions,
        currentPage,
        setCurrentPage,
        totalPages,
        hasActiveFilters,
        handleClearFilters,
        fetchProducts,
        fetchCategories,
    };
};

export default useProducts;
