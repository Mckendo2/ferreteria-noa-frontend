import React from 'react';
import workerImg from '../../../assets/images/worker.jpg';

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-background">
                <img src={workerImg} alt="Nuestro Trabajo" />
                <div className="hero-overlay"></div>
            </div>
            
            <div className="hero-content">
                <h1 className="hero-title">
                    TODO PARA TU <br /><span>OBRA Y HOGAR</span>
                </h1>
                <p className="hero-description">
                    Desde el tornillo más pequeño hasta la maquinaria más pesada. 
                    Encuentra calidad, variedad y los mejores precios del mercado.
                </p>
            </div>
        </section>
    );
};

export default Hero;
