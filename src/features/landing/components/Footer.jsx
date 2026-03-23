import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Hammer } from 'lucide-react';

const Footer = () => {
    const textStyle = { color: 'var(--text-secondary)', transition: 'none', cursor: 'default' };
    
    return (
        <footer className="landing-footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <h3>FERRETERIA <span>NOA</span></h3>
                    <p>Pasión por la calidad, compromiso con tu éxito.</p>
                    <div className="footer-socials">
                        <span style={textStyle}><Facebook size={24} /></span>
                        <span style={textStyle}><Instagram size={24} /></span>
                        <span style={textStyle}><Twitter size={24} /></span>
                    </div>
                </div>

                <div className="footer-column" id="nosotros">
                    <h4>Empresa</h4>
                    <ul className="footer-links">
                        <li style={textStyle}>Nosotros</li>
                        <li style={textStyle}>Trayectoria</li>
                        <li style={textStyle}>Marcas</li>
                        <li style={textStyle}>Sustentabilidad</li>
                    </ul>
                </div>

                <div className="footer-column" id="contacto">
                    <h4>Ayuda</h4>
                    <ul className="footer-links">
                        <li style={textStyle}>Soporte Técnico</li>
                        <li style={textStyle}>Envíos</li>
                        <li style={textStyle}>Devoluciones</li>
                        <li style={textStyle}>Privacidad</li>
                    </ul>
                </div>

                <div className="footer-column" id="ubicacion">
                    <h4>Contacto</h4>
                    <ul className="footer-links">
                        <li style={textStyle}><Phone size={16} /> +1 234 567 890</li>
                        <li style={textStyle}><Mail size={16} /> contacto@ferreterianoa.com</li>
                        <li style={textStyle}>
                            <MapPin size={16} /> 409 Ave de las Americas, La Paz
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} FERRETERIA NOA. Todos los derechos reservados.</p>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <span style={textStyle}>Términos y Condiciones</span>
                    <span style={textStyle}>Política de Privacidad</span>
                    <a href="/login" className="footer-link" style={{ fontWeight: 500 }}>Acceso</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
