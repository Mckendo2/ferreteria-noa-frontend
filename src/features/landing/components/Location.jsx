import React from 'react';

const Location = () => {
    const mapsLink = "https://www.google.com/maps?q=-16.4773838,-68.1196583&z=17&output=embed";
    const fullMapsLink = "https://www.google.com/maps/place/Ave+de+las+Americas+409,+La+Paz,+Bolivia/@-16.4773838,-68.1196583,17z";

    return (
        <section className="location-section" id="ubicacion" style={{padding: '8rem 10%', background: '#0A0A0A'}}>
            <div className="categories-header" style={{marginBottom: '4rem'}}>
                <span className="section-tag">Encuéntranos</span>
                <h2 style={{fontSize: '3rem', fontWeight: '900', textTransform: 'uppercase'}}>Nuestra Ubicación</h2>
            </div>

            <div className="location-map-container">
                <iframe 
                    src={mapsLink}
                    style={{border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)'}} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación FERRETERIA NOA"
                ></iframe>
                
                <a 
                    href={fullMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="map-clickable-overlay"
                >
                    <div className="map-hint">Abrir en Google Maps</div>
                </a>
            </div>
        </section>
    );
};

export default Location;
