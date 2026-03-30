import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard'; // <-- ВАЖНО: Импортируем нашу новую страницу

function App() {
    return (
        <Router>
            <Routes>
                {/* Главная страница с логином */}
                <Route path="/" element={<LoginPage />} />

                {/* Та самая страница, которую не мог найти React */}
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;