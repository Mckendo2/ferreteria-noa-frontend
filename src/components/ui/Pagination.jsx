import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end', width: '100%' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '1rem' }}>
                Página {currentPage} de {totalPages}
            </span>
            
            <button
                style={{ 
                    padding: '0.4rem', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', 
                    color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', borderRadius: '6px', 
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map(page => (
                <button
                    key={page}
                    style={{
                        padding: '0.4rem 0.8rem', 
                        border: '1px solid',
                        borderColor: currentPage === page ? 'var(--primary-blue)' : 'var(--border-light)',
                        background: currentPage === page ? 'var(--primary-blue)' : 'var(--bg-secondary)',
                        color: currentPage === page ? '#fff' : 'var(--text-primary)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: currentPage === page ? 'bold' : 'normal',
                        transition: 'all 0.2s ease',
                        fontSize: '0.875rem'
                    }}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </button>
            ))}

            <button
                style={{ 
                    padding: '0.4rem', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', 
                    color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)', borderRadius: '6px', 
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
