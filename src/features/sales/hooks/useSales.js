import { useState, useEffect, useCallback } from 'react';
import { getAvailableProducts } from '../services/saleService';

const useSales = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [loading, setLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAvailableProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching available products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Filter and sort products
    useEffect(() => {
        let result = [...products];

        // 1. Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.nombre.toLowerCase().includes(term) ||
                (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
                (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(term))
            );
        }

        // 2. Filter by category
        if (selectedCategory) {
            result = result.filter(p => p.categoria_nombre === selectedCategory);
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'name-asc') return a.nombre.localeCompare(b.nombre);
            if (sortBy === 'name-desc') return b.nombre.localeCompare(a.nombre);
            if (sortBy === 'price-asc') return parseFloat(a.precio_venta) - parseFloat(b.precio_venta);
            if (sortBy === 'price-desc') return parseFloat(b.precio_venta) - parseFloat(a.precio_venta);
            return 0;
        });

        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, sortBy, products]);

    // Get unique categories for the filter dropdown
    const categories = [...new Set(products.map(p => p.categoria_nombre).filter(Boolean))];

    // Add product to cart
    const addToCart = useCallback((product) => {
        if (product.stock <= 0) return;
        setCart(prev => {
            const existing = prev.find(item => item.producto_id === product.id);
            if (existing) {
                // Don't exceed available stock
                if (existing.cantidad >= product.stock) return prev;
                return prev.map(item =>
                    item.producto_id === product.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, {
                producto_id: product.id,
                nombre: product.nombre,
                precio: parseFloat(product.precio_venta),
                costo: parseFloat(product.precio_compra) || 0,
                cantidad: 1,
                stock: product.stock,
                imagen: product.imagen
            }];
        });
    }, []);

    // Remove product from cart
    const removeFromCart = useCallback((productoId) => {
        setCart(prev => prev.filter(item => item.producto_id !== productoId));
    }, []);

    // Update quantity in cart
    const updateQuantity = useCallback((productoId, newQty) => {
        if (newQty < 1) return;
        setCart(prev =>
            prev.map(item => {
                if (item.producto_id !== productoId) return item;
                const qty = Math.min(newQty, item.stock);
                return { ...item, cantidad: qty };
            })
        );
    }, []);

    // Update price in cart
    const updatePrice = useCallback((productoId, newPrice) => {
        if (newPrice < 0) return;
        setCart(prev =>
            prev.map(item =>
                item.producto_id === productoId
                    ? { ...item, precio: newPrice }
                    : item
            )
        );
    }, []);

    // Clear cart
    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    // Calculate totals
    const cartTotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

    return {
        products: filteredProducts,
        allProducts: products,
        cart,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        categories,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        clearCart,
        cartTotal,
        cartItemCount,
        fetchProducts,
        setCart,
    };
};

export default useSales;
