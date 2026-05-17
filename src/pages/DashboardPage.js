import React, { useEffect, useState } from 'react';
import { Users, Store, Bike, ShoppingBag, TrendingUp, Clock } from 'lucide-react';
import { getClientes, getRepartidores, getRestaurantes, reporteMontoTotal, reporteHoraPico, reporteClienteMayorPedidos } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ clientes:0, restaurantes:0, repartidores:0, montoTotal:0 });
  const [horaPico, setHoraPico] = useState(null);
  const [clienteTop, setClienteTop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [clientes, restaurantes, repartidores] = await Promise.allSettled([
          getClientes(), getRestaurantes(), getRepartidores()
        ]);
        const montoRes = await reporteMontoTotal().catch(() => null);
        const horaRes = await reporteHoraPico().catch(() => null);
        const clienteRes = await reporteClienteMayorPedidos().catch(() => null);

        setStats({
          clientes: clientes.status === 'fulfilled' ? (clientes.value?.length || 0) : 0,
          restaurantes: restaurantes.status === 'fulfilled' ? (restaurantes.value?.length || 0) : 0,
          repartidores: repartidores.status === 'fulfilled' ? (repartidores.value?.length || 0) : 0,
          montoTotal: montoRes?.monto_total_global || 0,
        });
        setHoraPico(horaRes);
        setClienteTop(Array.isArray(clienteRes) ? clienteRes[0] : clienteRes);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtColones = (v) => `₡${Number(v || 0).toLocaleString('es-CR', { minimumFractionDigits:2 })}`;

  const STATS = [
    { icon: Users, label:'Clientes Activos', value: stats.clientes, color:'#FF6B00' },
    { icon: Store, label:'Restaurantes', value: stats.restaurantes, color:'#FFC107' },
    { icon: Bike, label:'Repartidores', value: stats.repartidores, color:'#2E7D32' },
    { icon: ShoppingBag, label:'Monto Total Entregado', value: fmtColones(stats.montoTotal), color:'#1565C0', big:true },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del sistema CletaEats</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))' }}>
            {STATS.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-card-icon" style={{ background:`${color}18`, color }}>
                  <Icon size={22} />
                </div>
                <div className="stat-card-value" style={{ color, fontSize: typeof value === 'string' && value.length > 10 ? 20 : 28 }}>
                  {value}
                </div>
                <div className="stat-card-label">{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gap:20, gridTemplateColumns:'1fr 1fr' }}>
            {horaPico && (
              <div className="card">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ background:'#FFF0E0', borderRadius:10, padding:8, color:'var(--primary)' }}>
                    <Clock size={20} />
                  </div>
                  <h3>Hora Pico</h3>
                </div>
                <div style={{ fontSize:48, fontFamily:'Poppins', fontWeight:800, color:'var(--primary)' }}>
                  {String(horaPico.hora || 0).padStart(2,'0')}:00
                </div>
                <p style={{ color:'var(--on-surface-variant)', marginTop:4 }}>
                  {horaPico.total_pedidos} pedidos en esta hora
                </p>
              </div>
            )}

            {clienteTop && (
              <div className="card">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ background:'#E8F5E9', borderRadius:10, padding:8, color:'#2E7D32' }}>
                    <TrendingUp size={20} />
                  </div>
                  <h3>Cliente Estrella</h3>
                </div>
                <div style={{ fontSize:20, fontFamily:'Poppins', fontWeight:700, color:'var(--on-surface)' }}>
                  {clienteTop.nombre}
                </div>
                <p style={{ color:'var(--on-surface-variant)', fontSize:13, marginTop:4 }}>
                  Cédula: {clienteTop.cedula}
                </p>
                <div style={{ marginTop:10 }}>
                  <span className="badge badge-success">{clienteTop.total_pedidos} pedidos realizados</span>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop:20 }}>
            <h3 style={{ marginBottom:16 }}>Acerca de CletaEats</h3>
            <p style={{ color:'var(--on-surface-variant)', lineHeight:1.8 }}>
              Sistema de gestión de pedidos de comida a domicilio por bicicleta. Permite administrar clientes, repartidores,
              restaurantes y pedidos de forma centralizada. Desarrollado para EIF-411 — Universidad Nacional, I ciclo 2026.
            </p>
            <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
              <span className="chip">Backend: Java 11</span>
              <span className="chip">DB: MySQL 8</span>
              <span className="chip">Railway Deploy</span>
              <span className="chip">Frontend: React</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
