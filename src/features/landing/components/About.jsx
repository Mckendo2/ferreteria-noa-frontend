import React from 'react';
import aboutImg from '../../../assets/images/about.png';

const About = () => {
    return (
        <section className="about-section" id="nosotros">
            <div className="about-image">
                <img src={aboutImg} alt="Nuestro Almacén" />
            </div>
            <div className="about-content">
                <span className="section-tag">Conócenos</span>
                <h2>Tu aliado en cada <br /> remodelación</h2>
                <p>
                    En FERRETERIA NOA, creemos que cada proyecto, grande o pequeño, merece los mejores materiales.
                    Por más de 10 años, hemos sido el punto de encuentro de maestros, constructores y familias
                    que buscan calidad y buen trato en La Paz.
                </p>
                <div className="hero-actions">
                    <button className="btn-industrial btn-industrial-primary">Ver Nuestra Tienda</button>
                </div>
            </div>
        </section>
    );
};

export default About;
