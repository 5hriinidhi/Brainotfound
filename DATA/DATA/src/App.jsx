import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GameSelection from './pages/GameSelection';
import DashboardDisaster from './pages/DashboardDisaster';
import FraudOrLegit from './pages/FraudOrLegit';

function App() {
    return (
        <Routes>
            <Route path="/" element={<GameSelection />} />
            <Route path="/game1" element={<DashboardDisaster />} />
            <Route path="/game2" element={<FraudOrLegit />} />
        </Routes>
    );
}

export default App;
