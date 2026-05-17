import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import RepartidoresPage from './pages/RepartidoresPage';
import RestaurantesPage from './pages/RestaurantesPage';
import PedidosPage from './pages/PedidosPage';
import ReportesPage from './pages/ReportesPage';

const PrivateRoute = ({ children }) => {
  const isAuth = !!localStorage.getItem('cletaeats_user');
  return isAuth ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="repartidores" element={<RepartidoresPage />} />
          <Route path="restaurantes" element={<RestaurantesPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="reportes" element={<ReportesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
