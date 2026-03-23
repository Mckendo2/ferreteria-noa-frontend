import React, { useState, useEffect } from 'react';
import { Hammer } from 'lucide-react';
const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="landing-logo">
                <Hammer size={32} />
                FERRETERIA <span>NOA</span>
            </div>
            
            <ul className="landing-nav-links">
                <li><a onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="landing-nav-link">Inicio</a></li>
                <li><a onClick={() => scrollToSection('nosotros')} className="landing-nav-link">Nosotros</a></li>
                <li><a onClick={() => scrollToSection('contacto')} className="landing-nav-link">Contacto</a></li>
                <li><a onClick={() => scrollToSection('ubicacion')} className="landing-nav-link">Ubicación</a></li>
            </ul>

        </nav>
    );
};

export default Navbar;
