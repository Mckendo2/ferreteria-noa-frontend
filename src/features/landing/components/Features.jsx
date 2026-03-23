import React from 'react';
import { ShieldCheck, Truck, Clock, Cog } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <ShieldCheck size={48} />,
            title: "Las Mejores Marcas",
            description: "Trabajamos únicamente con marcas líderes que garantizan durabilidad en cada trabajo."
        },
        {
            icon: <Truck size={48} />,
            title: "Entrega Inmediata",
            description: "Contamos con stock permanente para que tu obra nunca se detenga por falta de materiales."
        },
        {
            icon: <Clock size={48} />,
            title: "Atención Experta",
            description: "Nuestro equipo técnico te asesora para que elijas exactamente lo que tu proyecto necesita."
        },
        {
            icon: <Cog size={48} />,
            title: "Todo en un solo lugar",
            description: "Desde materiales básicos hasta herramientas especializadas. Lo tenemos todo."
        }
    ];

    return (
        <section className="features-section">
            <div className="features-grid">
                {features.map((feature, index) => (
                    <div className="feature-card" key={index}>
                        <div className="feature-icon">{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Features;
