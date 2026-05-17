import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  reporteMayorPedidos, reporteMenorPedidos, reporteMontosPorRestaurante,
  reporteMontoTotal, reporteClienteMayorPedidos, reporteHoraPico
} from '../services/api';

const fmtColones = (v) => `₡${Number(v||0).toLocaleString('es-CR',{minimumFractionDigits:2})}`;

const ReportCard = ({ icon: Icon, iconColor, iconBg, title, loading, children }) => (
  <div className="card">
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
      <div style={{ background:iconBg, borderRadius:10, padding:8, color:iconColor }}>
        <Icon size={20} />
      </div>
      <h3 style={{ fontSize:15 }}>{title}</h3>
    </div>
    {loading ? (
      <div style={{ display:'flex', justifyContent:'center', padding:20 }}>
        <div className="spinner" style={{ width:28, height:28, borderWidth:2 }} />
      </div>
    ) : children}
  </div>
);

export default function ReportesPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});

  const fetchReport = async (key, fn) => {
    setLoading(prev => ({...prev, [key]: true}));
    try {
      const res = await fn();
      setData(prev => ({...prev, [key]: res}));
    } catch (e) { toast.error(`Error: ${e.message}`); }
    finally { setLoading(prev => ({...prev, [key]: false})); }
  };

  const fetchAll = async () => {
    const reports = [
      ['mayorPedidos', reporteMayorPedidos],
      ['menorPedidos', reporteMenorPedidos],
      ['montosPorRest', reporteMontosPorRestaurante],
      ['montoTotal', reporteMontoTotal],
      ['clienteTop', reporteClienteMayorPedidos],
      ['horaPico', reporteHoraPico],
    ];
    await Promise.all(reports.map(([k, fn]) => fetchReport(k, fn)));
    toast.success('Reportes actualizados');
  };

  const normalizeArr = (val) => Array.isArray(val) ? val : val ? [val] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Indicadores del sistema CletaEats</p>
        </div>
        <button className="btn btn-primary" onClick={fetchAll}>
          <RefreshCw size={16} /> Cargar todos
        </button>
      </div>

      <div style={{ display:'grid', gap:20, gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))' }}>

        {/* (i) Mayor pedidos */}
        <ReportCard icon={TrendingUp} iconColor="#FF6B00" iconBg="#FFF0E0"
          title="(i) Restaurante con más pedidos" loading={loading.mayorPedidos}>
          {data.mayorPedidos ? (
            <div>
              <div style={{ fontSize:20, fontWeight:800, fontFamily:'Poppins' }}>
                {normalizeArr(data.mayorPedidos)[0]?.nombre}
              </div>
              <div style={{ fontSize:14, color:'var(--on-surface-variant)', marginTop:4 }}>
                {normalizeArr(data.mayorPedidos)[0]?.total_pedidos} pedidos
              </div>
            </div>
          ) : <button className="btn btn-outline btn-sm" onClick={() => fetchReport('mayorPedidos', reporteMayorPedidos)}>Consultar</button>}
        </ReportCard>

        {/* (l) Menor pedidos */}
        <ReportCard icon={TrendingDown} iconColor="#1565C0" iconBg="#E3F2FD"
          title="(l) Restaurante con menos pedidos" loading={loading.menorPedidos}>
          {data.menorPedidos ? (
            <div>
              <div style={{ fontSize:20, fontWeight:800, fontFamily:'Poppins' }}>
                {normalizeArr(data.menorPedidos)[0]?.nombre}
              </div>
              <div style={{ fontSize:14, color:'var(--on-surface-variant)', marginTop:4 }}>
                {normalizeArr(data.menorPedidos)[0]?.total_pedidos} pedidos
              </div>
            </div>
          ) : <button className="btn btn-outline btn-sm" onClick={() => fetchReport('menorPedidos', reporteMenorPedidos)}>Consultar</button>}
        </ReportCard>

        {/* (k) Monto total */}
        <ReportCard icon={DollarSign} iconColor="#2E7D32" iconBg="#E8F5E9"
          title="(k) Monto total global" loading={loading.montoTotal}>
          {data.montoTotal ? (
            <div style={{ fontSize:28, fontWeight:800, fontFamily:'Poppins', color:'var(--primary)' }}>
              {fmtColones(data.montoTotal?.monto_total_global || data.montoTotal)}
            </div>
          ) : <button className="btn btn-outline btn-sm" onClick={() => fetchReport('montoTotal', reporteMontoTotal)}>Consultar</button>}
        </ReportCard>

        {/* (o) Cliente top */}
        <ReportCard icon={Users} iconColor="#7B1FA2" iconBg="#F3E5F5"
          title="(o) Cliente con más pedidos" loading={loading.clienteTop}>
          {data.clienteTop ? (() => {
            const c = normalizeArr(data.clienteTop)[0] || {};
            return (
              <div>
                <div style={{ fontSize:18, fontWeight:800, fontFamily:'Poppins' }}>{c.nombre}</div>
                <div style={{ fontSize:13, color:'var(--on-surface-variant)', marginTop:2 }}>Cédula: {c.cedula}</div>
                <div style={{ marginTop:8 }}>
                  <span className="badge badge-success">{c.total_pedidos} pedidos</span>
                </div>
              </div>
            );
          })() : <button className="btn btn-outline btn-sm" onClick={() => fetchReport('clienteTop', reporteClienteMayorPedidos)}>Consultar</button>}
        </ReportCard>

        {/* (p) Hora pico */}
        <ReportCard icon={Clock} iconColor="#E65100" iconBg="#FBE9E7"
          title="(p) Hora pico de pedidos" loading={loading.horaPico}>
          {data.horaPico ? (() => {
            const h = normalizeArr(data.horaPico)[0] || {};
            return (
              <div>
                <div style={{ fontSize:40, fontWeight:800, fontFamily:'Poppins', color:'var(--primary)' }}>
                  {String(h.hora||0).padStart(2,'0')}:00
                </div>
                <div style={{ fontSize:13, color:'var(--on-surface-variant)', marginTop:4 }}>
                  {h.total_pedidos} pedidos en esta hora
                </div>
              </div>
            );
          })() : <button className="btn btn-outline btn-sm" onClick={() => fetchReport('horaPico', reporteHoraPico)}>Consultar</button>}
        </ReportCard>

        {/* (j) Montos por restaurante */}
        <ReportCard icon={BarChart3} iconColor="#FF6B00" iconBg="#FFF0E0"
          title="(j) Monto por restaurante" loading={loading.montosPorRest}>
          {data.montosPorRest ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {normalizeArr(data.montosPorRest).slice(0,5).map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                  <span style={{ fontWeight:600, flex:1, marginRight:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.nombre}
                  </span>
                  <span style={{ fontWeight:700, color:'var(--primary)', flexShrink:0 }}>
                    {fmtColones(r.monto_total || r.total || 0)}
                  </span>
                </div>
              ))}
              {normalizeArr(data.montosPorRest).length > 5 && (
                <p style={{ fontSize:12, color:'var(--on-surface-variant)' }}>
                  +{normalizeArr(data.montosPorRest).length - 5} más...
                </p>
              )}
            </div>
          ) : <button className="btn btn-outline btn-sm" onClick={() => fetchReport('montosPorRest', reporteMontosPorRestaurante)}>Consultar</button>}
        </ReportCard>

      </div>
    </div>
  );
}
