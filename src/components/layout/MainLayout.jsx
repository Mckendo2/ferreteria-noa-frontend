import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        // Auto-collapse sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    }, [location]);

    return (
        <div className="main-layout">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="content-wrapper">
                <Sidebar isOpen={isSidebarOpen} />
                <main 
                    key={location.pathname}
                    className="main-content page-transition-enter-active"
                >
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
