import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import useCategories from '../hooks/useCategories';
import CategoryModal from '../components/CategoryModal';
import PageHeader from '../../../components/ui/PageHeader';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';

const CategoriesPage = () => {
    const {
        categories,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleToggleStatus,
        fetchCategories,
    } = useCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);

    const handleNewCategory = () => {
        setActiveCategory(null);
        setIsModalOpen(true);
    };

    const handleEditCategory = (category) => {
        setActiveCategory(category);
        setIsModalOpen(true);
    };

    return (
        <div className="module-container">
            <PageHeader
                title="Categorías de Productos"
                actionLabel="Nueva Categoría"
                actionIcon={Plus}
                onAction={handleNewCategory}
            />

            <div className="filters-bar" style={{ marginBottom: '2rem' }}>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre o descripción..."
                />
            </div>

            <div className="table-responsive page-transition-enter-active">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length > 0 ? (
                            categories.map(category => (
                                <tr key={category.id} style={{ opacity: category.activo ? 1 : 0.6 }}>
                                    <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{category.id}</span></td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{category.nombre}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{category.descripcion || 'Sin descripción'}</td>
                                    <td>
                                        {category.activo ? (
                                            <span className="badge success">Activo</span>
                                        ) : (
                                            <span className="badge danger">Inactivo</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="icon-btn" 
                                                title="Editar"
                                                onClick={() => handleEditCategory(category)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                className="icon-btn" 
                                                title={category.activo ? "Desactivar" : "Reactivar"} 
                                                onClick={() => handleToggleStatus(category)} 
                                                style={{ color: category.activo ? 'var(--danger-red)' : 'var(--accent-mint)' }}
                                            >
                                                {category.activo ? <Trash2 size={16} /> : <Plus size={16} style={{ transform: 'rotate(45deg)' }} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No se encontraron categorías.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <CategoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={fetchCategories} 
                categoryToEdit={activeCategory}
            />
        </div>
    );
};

export default CategoriesPage;
