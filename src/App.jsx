import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/portfolio.jsx'; 
import AdminPanel from './pages/AdminPanel.jsx';
import KioskMode from './pages/KioskMode.jsx';
import ScheduleView from './pages/ScheduleView.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = sessionStorage.getItem('role');
    if (!role || !allowedRoles.includes(role)) {
        return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white text-xl">Access Denied</div>;
    }
    return children;
};

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
                <Route 
                    path="/parent-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['parent']}>
                            <ParentDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/teacher-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                            <TeacherDashboard />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
};

export default App;
