import React, { useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import About from '../components/About';
import Categories from '../components/Categories';
import Location from '../components/Location';
import Footer from '../components/Footer';

const LandingPage = () => {
    const { logout } = useAuth();

    useEffect(() => {
        logout();
    }, []); // Only logout once on mount

    return (
        <div className="landing-page">
            <Navbar />
            <Hero />
            <Features />
            <About />
            <Categories />
            <Location />
            
            <Footer />
        </div>
    );
};

export default LandingPage;
