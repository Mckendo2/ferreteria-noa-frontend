import React, { useState, useRef } from 'react';
import Select from 'react-select';
import { Plus, Filter, X, Box, Save, Image as ImageIcon, Eye, Edit, Trash2, DollarSign, Package, Download, FileSpreadsheet } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import { updateProduct, importInventory } from '../services/productService';
import { BASE_URL } from '../../../services/api';
import Swal from 'sweetalert2';
import ProductModal from '../components/ProductModal';
import ProductDetailModal from '../components/ProductDetailModal';
import PageHeader from '../../../components/ui/PageHeader';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import { exportInventoryToExcel } from '../services/excelExportService';

const ProductsPage = () => {
    const {
        products,
        allProducts,
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
    } = useProducts();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [editedProducts, setEditedProducts] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    const handleEditChange = (id, field, value) => {
        setEditedProducts(prev => {
            const currentEdit = prev[id] || {};
            return {
                ...prev,
                [id]: {
                    ...currentEdit,
                    [field]: value
                }
            };
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const updatePromises = Object.entries(editedProducts).map(async ([id, changes]) => {
                const original = products.find(p => p.id.toString() === id) || allProducts.find(p => p.id.toString() === id);
                if (!original) return;

                const formDataToSend = new FormData();
                formDataToSend.append('nombre', original.nombre);
                if (original.descripcion) formDataToSend.append('descripcion', original.descripcion);
                if (original.codigo_barras) formDataToSend.append('codigo_barras', original.codigo_barras);
                formDataToSend.append('categoria_id', original.categoria_id);
                
                formDataToSend.append('precio_compra', changes.precio_compra ?? original.precio_compra);
                formDataToSend.append('precio_venta', changes.precio_venta ?? original.precio_venta);
                formDataToSend.append('stock', changes.stock ?? original.stock);
                
                formDataToSend.append('stock_minimo', original.stock_minimo ?? 5);
                formDataToSend.append('activo', original.activo ? 1 : 0);

                await updateProduct(id, formDataToSend);
            });

            await Promise.all(updatePromises);

            Swal.fire({
                title: '¡Actualizado!',
                text: 'Los productos han sido actualizados correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });

            setEditedProducts({});
            fetchProducts();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al guardar los cambios.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleOpenDetail = (product) => {
        setViewingProduct(product);
    };

    const getCategoryName = (product) => {
        const cat = categories.find(c => c.value === product.categoria_id);
        return cat ? cat.label : `Categoría ${product.categoria_id}`;
    };

    const handleExportExcel = (categoryId = 'all') => {
        exportInventoryToExcel(allProducts, categories, categoryId);
        setIsExportMenuOpen(false);
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input immediately to allow same file re-upload
        e.target.value = '';

        setIsImporting(true);
        Swal.fire({
            title: 'Importando Inventario...',
            text: 'Por favor espera mientras procesamos el archivo Excel.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: { popup: 'my-swal-bg' }
        });

        try {
            const result = await importInventory(file);
            Swal.fire({
                title: '¡Importación Completada!',
                html: `
                    <div style="text-align: left; margin-top: 1rem;">
                        <p>✅ Productos creados: <b>${result.results.created}</b></p>
                        <p>🔄 Productos actualizados: <b>${result.results.updated}</b></p>
                        ${result.results.errors.length > 0 ? `
                            <div style="margin-top: 1rem; color: var(--danger-red);">
                                <p>⚠️ Errores (${result.results.errors.length}):</p>
                                <ul style="font-size: 0.85rem; max-height: 150px; overflow-y: auto; padding-left: 1.2rem;">
                                    ${result.results.errors.map(err => `<li>${err}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `,
                icon: result.results.errors.length > 0 ? 'warning' : 'success',
                confirmButtonText: 'Entendido',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            fetchProducts();
        } catch (error) {
            Swal.fire({
                title: 'Error de Importación',
                text: error.response?.data?.error || 'Hubo un problema al procesar el archivo Excel. Asegúrate de que el formato sea correcto.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setIsImporting(false);
        }
    };

    const totalProductsCount = allProducts.length;
    const totalInventoryCost = allProducts.reduce((acc, curr) => {
        const compra = parseFloat(curr.precio_compra) || 0;
        const stock = parseInt(curr.stock) || 0;
        return acc + (compra * stock);
    }, 0);

    return (
        <div className="module-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <PageHeader
                    title="Catálogo de Productos"
                    actionLabel="Nuevo Producto"
                    actionIcon={Plus}
                    onAction={handleOpenCreate}
                    style={{ marginBottom: 0 }}
                />

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept=".xlsx, .xls"
                        onChange={handleImportExcel}
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        disabled={isImporting}
                        className="btn-secondary"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', 
                            padding: '0.6rem 1rem', background: '#217346', 
                            color: 'white', border: 'none', borderRadius: '8px',
                            opacity: isImporting ? 0.7 : 1
                        }}
                    >
                        <Download size={18} style={{ transform: 'rotate(180deg)' }} />
                        {isImporting ? 'Importando...' : 'Importar Excel'}
                    </button>
                    
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="btn-secondary"
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                padding: '0.6rem 1rem', background: '#107c41', 
                                color: 'white', border: 'none', borderRadius: '8px'
                            }}
                        >
                            <FileSpreadsheet size={18} />
                            Exportar Excel
                        </button>
                        
                        {isExportMenuOpen && (
                            <div style={{ 
                                position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', 
                                background: 'var(--bg-card)', borderRadius: '8px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '220px',
                                border: '1px solid var(--border-light)', overflow: 'hidden'
                            }}>
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    OPCIONES DE EXPORTACIÓN
                                </div>
                                <button 
                                    onClick={() => handleExportExcel('all')}
                                    style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Download size={16} /> Todo el inventario
                                </button>
                                <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Por Categoría:</div>
                                {categories.map(cat => (
                                    <button 
                                        key={cat.value}
                                        onClick={() => handleExportExcel(cat.value)}
                                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem 0.5rem 2.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* METRICS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 112, 243, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-color)' }}>
                        <Package size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total de Productos</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{totalProductsCount}</div>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 200, 83, 0.1)', padding: '1rem', borderRadius: '12px', color: '#00C853' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Costo Total Inventario</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>Bs {totalInventoryCost.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* BARRA DE FILTROS HORIZONTAL */}
            <div className="filters-bar">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre o código..."
                />

                <div className="filter-group" style={{ zIndex: 10 }}>
                    <Select
                        classNamePrefix="react-select"
                        placeholder="Todas las categorías..."
                        isClearable
                        options={[{ value: 'all', label: 'Todas las categorías' }, ...categories]}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        noOptionsMessage={() => "No hay categorías"}
                    />
                </div>

                <div className="filter-group" style={{ zIndex: 9 }}>
                    <Select
                        classNamePrefix="react-select"
                        placeholder="Ordenar por..."
                        isClearable
                        options={sortOptions}
                        value={selectedSort}
                        onChange={setSelectedSort}
                    />
                </div>
            </div>

            {/* BADGES E INDICADORES DE FILTRO ACTIVO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="active-filters">
                    <Filter size={16} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
                    <span className="results-count">Mostrando {allProducts.length} productos</span>

                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={handleClearFilters} style={{ marginLeft: '1rem' }}>
                            Limpiar todos
                        </button>
                    )}

                    {searchTerm && (
                        <div className="filter-badge">
                            Búsqueda: {searchTerm}
                            <button onClick={() => setSearchTerm('')}><X size={12} /></button>
                        </div>
                    )}
                    {selectedCategory && selectedCategory.value !== 'all' && (
                        <div className="filter-badge">
                            Categoría: {selectedCategory.label}
                            <button onClick={() => setSelectedCategory(null)}><X size={12} /></button>
                        </div>
                    )}
                    {selectedSort && (
                        <div className="filter-badge">
                            Orden: {selectedSort.label}
                            <button onClick={() => setSelectedSort(null)}><X size={12} /></button>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* PRODUCT TABLE */}
            <div className="table-container page-transition-enter-active" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Imagen</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Producto</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Precio Compra (Bs)</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Precio Venta (Bs)</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Stock</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Margen Ganancia</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map(product => {
                                const edits = editedProducts[product.id] || {};
                                const currentCompra = edits.precio_compra ?? product.precio_compra ?? 0;
                                const currentVenta = edits.precio_venta ?? product.precio_venta ?? 0;
                                const currentStock = edits.stock ?? product.stock ?? 0;
                                const margin = (currentVenta - currentCompra).toFixed(2);
                                
                                return (
                                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)', background: editedProducts[product.id] ? 'rgba(0, 112, 243, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {product.imagen ? (
                                                <img 
                                                    src={product.imagen.startsWith('http') ? product.imagen : `${BASE_URL}${product.imagen}`} 
                                                    alt={product.nombre}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                                    <ImageIcon size={20} color="var(--text-secondary)" />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{product.nombre}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{getCategoryName(product)} | {product.codigo_barras || 'Sin código'}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                value={currentCompra}
                                                onChange={(e) => handleEditChange(product.id, 'precio_compra', e.target.value)}
                                                style={{ width: '90px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                value={currentVenta}
                                                onChange={(e) => handleEditChange(product.id, 'precio_venta', e.target.value)}
                                                style={{ width: '90px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={currentStock}
                                                onChange={(e) => handleEditChange(product.id, 'stock', e.target.value)}
                                                style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', background: margin > 0 ? 'rgba(0, 200, 83, 0.1)' : margin < 0 ? 'rgba(238, 0, 0, 0.1)' : 'var(--bg-secondary)', color: margin > 0 ? 'var(--accent-color)' : margin < 0 ? 'var(--danger-red)' : 'var(--text-secondary)' }}>
                                                Bs {margin}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="icon-btn" title="Ver detalles" onClick={() => handleOpenDetail(product)}><Eye size={18} /></button>
                                                <button className="icon-btn" title="Editar completo" onClick={() => handleOpenEdit(product)}><Edit size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                    <Box size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No hay productos para mostrar</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>Intenta ajustar los filtros de búsqueda o agrega un nuevo producto.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* FLOATING SAVE BUTTON */}
            {Object.keys(editedProducts).length > 0 && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }} className="page-transition-enter-active">
                    <button 
                        onClick={handleSaveChanges} 
                        disabled={isSaving}
                        className="btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderRadius: '50px', boxShadow: '0 4px 14px rgba(0, 112, 243, 0.4)', fontSize: '1.1rem', fontWeight: 600 }}
                    >
                        <Save size={20} />
                        {isSaving ? 'Guardando...' : `Guardar Cambios (${Object.keys(editedProducts).length})`}
                    </button>
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <ProductModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={fetchProducts} 
                onRefreshCategories={fetchCategories}
                categories={categories}
                product={editingProduct}
            />

            <ProductDetailModal
                isOpen={!!viewingProduct}
                onClose={() => setViewingProduct(null)}
                product={viewingProduct}
                categoryName={viewingProduct ? getCategoryName(viewingProduct) : ''}
            />
        </div>
    );
};

export default ProductsPage;
