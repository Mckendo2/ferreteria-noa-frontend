import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../../products/services/productService';
import { getPurchases, createPurchase } from '../services/purchaseService';

const usePurchases = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);

    const [purchasesHistory, setPurchasesHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPurchasesHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const data = await getPurchases();
            setPurchasesHistory(data);
        } catch (error) {
            console.error('Error fetching purchases history:', error);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Filter products
    useEffect(() => {
        let result = [...products];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.nombre.toLowerCase().includes(term) ||
                (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
                (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(term))
            );
        }

        if (selectedCategory) {
            result = result.filter(p => p.categoria_nombre === selectedCategory);
        }

        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, products]);

    const categories = [...new Set(products.map(p => p.categoria_nombre).filter(Boolean))];

    const addToCart = useCallback((product) => {
        setCart(prev => {
            const existing = prev.find(item => item.producto_id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.producto_id === product.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, {
                producto_id: product.id,
                nombre: product.nombre,
                // By default use current purchase price or selling price
                precio: parseFloat(product.precio_compra) || 0,
                cantidad: 1,
                imagen: product.imagen
            }];
        });
    }, []);

    const removeFromCart = useCallback((productoId) => {
        setCart(prev => prev.filter(item => item.producto_id !== productoId));
    }, []);

    const updateQuantity = useCallback((productoId, newQty) => {
        if (newQty < 1) return;
        setCart(prev =>
            prev.map(item =>
                item.producto_id === productoId
                    ? { ...item, cantidad: newQty }
                    : item
            )
        );
    }, []);

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

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const submitPurchase = async (proveedor_id) => {
        const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const purchaseData = {
            proveedor_id,
            total,
            detalles: cart.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio: item.precio
            }))
        };

        const result = await createPurchase(purchaseData);
        clearCart();
        return result;
    };

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
        categories,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        clearCart,
        submitPurchase,
        cartTotal,
        cartItemCount,
        fetchProducts,
        purchasesHistory,
        loadingHistory,
        fetchPurchasesHistory
    };
};

export default usePurchases;
