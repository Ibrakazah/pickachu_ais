import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/portfolio.jsx'; 
import AdminPanel from './pages/AdminPanel.jsx';
import KioskMode from './pages/KioskMode.jsx';
import ScheduleView from './pages/ScheduleView.jsx';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/homepage" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/kiosk" element={<KioskMode />} />
                <Route path="/schedule" element={<ScheduleView />} />
            </Routes>
        </Router>
    );
};

export default App;