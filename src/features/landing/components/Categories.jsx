import React from 'react';
import toolsImg from '../../../assets/images/cat_tools.png';
import electricalImg from '../../../assets/images/cat_electrical.png';
import heroImg from '../../../assets/images/hero.png'; // Reutilizando la de hero para construcción

const Categories = () => {
    const categories = [
        { title: "Herramientas Manuales", image: toolsImg, count: "Calidad Profesional" },
        { title: "Materiales Eléctricos", image: electricalImg, count: "Seguridad Total" },
        { title: "Ferretería General", image: heroImg, count: "Todo tipo de pernería" }
    ];

    return (
        <section className="categories-preview">
            <div className="categories-header">
                <span className="section-tag">Explora</span>
                <h2 style={{fontSize: '3rem', fontWeight: '900', textTransform: 'uppercase'}}>Categorías Principales</h2>
            </div>
            <div className="categories-grid">
                {categories.map((cat, index) => (
                    <div className="category-item" key={index}>
                        <img src={cat.image} alt={cat.title} />
                        <div className="category-overlay">
                            <h4>{cat.title}</h4>
                            <span>{cat.count}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Categories;
