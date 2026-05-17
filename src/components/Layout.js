import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bike, Store, ShoppingBag,
  BarChart3, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/repartidores', icon: Bike, label: 'Repartidores' },
  { to: '/restaurantes', icon: Store, label: 'Restaurantes' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
];

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('cletaeats_user') || '{}');

  const logout = () => {
    localStorage.removeItem('cletaeats_user');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{
            width:44, height:44, borderRadius:12,
            background:'#FF6B00', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Poppins,sans-serif', fontWeight:800, color:'white', fontSize:20
          }}>C</div>
          <div className="sidebar-logo-text">
            <span>CletaEats</span>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navegación</div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon />
              {label}
              <ChevronRight style={{ marginLeft:'auto', width:14, opacity:0.4 }} />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize:12, color:'var(--on-surface-variant)', marginBottom:10, fontWeight:600 }}>
            Sesión: <span style={{ color:'var(--primary)' }}>{user.nombre || user.usuario || 'Admin'}</span>
          </div>
          <button className="btn btn-ghost btn-block" onClick={logout}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <header className="topbar">
          <button
            className="btn btn-ghost btn-sm"
            style={{ display:'flex', gap:6 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:34, height:34, borderRadius:10,
              background:'var(--primary-container)', color:'var(--primary)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:15, fontFamily:'Poppins,sans-serif'
            }}>
              {(user.nombre || 'A')[0].toUpperCase()}
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--on-surface-variant)' }}>
              {user.nombre || user.usuario || 'Admin'}
            </span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
