import React, { useEffect, useState } from 'react';
import { Plus, ShoppingBag, CheckCircle, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  crearPedido, agregarDetalle, confirmarPedido,
  cambiarEstado, generarFactura, getPedidosCliente,
  getRestaurantes, getCombos, getClientes
} from '../services/api';

const ESTADOS = ['en_preparacion','en_camino','entregado'];
const ESTADO_LABELS = {
  en_preparacion: { label:'En preparación', cls:'badge-warning', icon:'🍳' },
  en_camino: { label:'En camino', cls:'badge-info', icon:'🚴' },
  entregado: { label:'Entregado', cls:'badge-success', icon:'✅' },
  suspendido: { label:'Suspendido', cls:'badge-danger', icon:'❌' },
};

const fmtColones = (v) => `₡${Number(v||0).toLocaleString('es-CR',{minimumFractionDigits:2})}`;

export default function PedidosPage() {
  const [step, setStep] = useState(0); // 0=buscar cliente, 1=flujo pedido, 2=pedidos del cliente
  const [clientes, setClientes] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedRestaurante, setSelectedRestaurante] = useState(null);
  const [pedidoActual, setPedidoActual] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [factura, setFactura] = useState(null);
  const [cedulaBuscar, setCedulaBuscar] = useState('');
  const [distancia, setDistancia] = useState(1);
  const [esFeriado, setEsFeriado] = useState(false);
  const [comboSel, setComboSel] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subStep, setSubStep] = useState(0); // 0=elegir rest, 1=crear pedido, 2=detalles, 3=confirmar, 4=factura

  useEffect(() => {
    getRestaurantes().then(d => setRestaurantes(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  const buscarCliente = async () => {
    if (!cedulaBuscar.trim()) { toast.error('Ingresa una cédula'); return; }
    setLoading(true);
    try {
      const { getClienteByCedula } = await import('../services/api');
      const c = await getClienteByCedula(cedulaBuscar);
      if (!c || !c.id) { toast.error('Cliente no encontrado'); return; }
      if (c.estado === 'suspendido') { toast.error('Este cliente está suspendido'); return; }
      setSelectedCliente(c);
      // load their orders
      const peds = await getPedidosCliente(c.id).catch(() => []);
      setPedidos(Array.isArray(peds) ? peds : []);
      setStep(1);
    } catch (e) { toast.error(e.message || 'Error buscando cliente'); }
    finally { setLoading(false); }
  };

  const elegirRestaurante = async (rest) => {
    setSelectedRestaurante(rest);
    const data = await getCombos(rest.id).catch(() => []);
    setCombos(Array.isArray(data) ? data : []);
    setSubStep(1);
  };

  const handleCrearPedido = async () => {
    setLoading(true);
    try {
      const p = await crearPedido({
        cedulaCliente: selectedCliente.cedula,
        idRestaurante: selectedRestaurante.id,
        distanciaKm: distancia,
        esFeriado,
      });
      setPedidoActual(p);
      setSubStep(2);
      toast.success(`Pedido #${p.id || p.idPedido} creado`);
    } catch (e) { toast.error(e.message || 'Error creando pedido'); }
    finally { setLoading(false); }
  };

  const handleAgregarDetalle = async () => {
    if (!comboSel) { toast.error('Selecciona un combo'); return; }
    const pedidoId = pedidoActual?.id || pedidoActual?.idPedido;
    setLoading(true);
    try {
      await agregarDetalle(pedidoId, { idCombo: Number(comboSel), cantidad: Number(cantidad) });
      const combo = combos.find(c => c.id === Number(comboSel));
      setDetalles(prev => [...prev, { ...combo, cantidad }]);
      toast.success('Combo agregado al pedido');
    } catch (e) { toast.error(e.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleConfirmar = async () => {
    const pedidoId = pedidoActual?.id || pedidoActual?.idPedido;
    setLoading(true);
    try {
      const res = await confirmarPedido(pedidoId);
      setPedidoActual(res || pedidoActual);
      setSubStep(3);
      toast.success('Pedido confirmado y repartidor asignado');
    } catch (e) { toast.error(e.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleGenerarFactura = async () => {
    const pedidoId = pedidoActual?.id || pedidoActual?.idPedido;
    setLoading(true);
    try {
      const f = await generarFactura(pedidoId);
      setFactura(f);
      setSubStep(4);
      toast.success('Factura generada');
    } catch (e) { toast.error(e.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await cambiarEstado(pedidoId, { estado: nuevoEstado });
      toast.success(`Estado actualizado a "${nuevoEstado}"`);
      const peds = await getPedidosCliente(selectedCliente.id).catch(() => []);
      setPedidos(Array.isArray(peds) ? peds : []);
    } catch (e) { toast.error(e.message || 'Error'); }
  };

  const resetPedido = () => {
    setSubStep(0); setSelectedRestaurante(null); setPedidoActual(null);
    setDetalles([]); setFactura(null); setDistancia(1); setEsFeriado(false);
    setComboSel(''); setCantidad(1);
  };

  // ── STEP 0: BUSCAR CLIENTE ─────────────────────
  if (step === 0) return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Busca un cliente por cédula para gestionar sus pedidos</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth:480 }}>
        <h3 style={{ marginBottom:16 }}>Buscar cliente</h3>
        <div className="form-group">
          <label className="form-label">Cédula del cliente *</label>
          <input className="form-input" placeholder="1-1111-1111" value={cedulaBuscar}
            onChange={e => setCedulaBuscar(e.target.value)}
            onKeyDown={e => e.key==='Enter' && buscarCliente()} />
        </div>
        <button className="btn btn-primary btn-block" onClick={buscarCliente} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar cliente'}
        </button>
      </div>
    </div>
  );

  // ── STEP 1: PANEL CLIENTE ──────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">
            Cliente: <strong>{selectedCliente?.nombre}</strong>
            <span className={`badge ${selectedCliente?.estado==='activo'?'badge-success':'badge-danger'}`}
              style={{ marginLeft:8 }}>{selectedCliente?.estado}</span>
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={() => { setStep(0); resetPedido(); setCedulaBuscar(''); }}>
            Cambiar cliente
          </button>
          <button className="btn btn-primary" onClick={resetPedido}>
            <Plus size={16} /> Nuevo pedido
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gap:24, gridTemplateColumns:'1fr 1fr' }}>
        {/* NUEVO PEDIDO FLOW */}
        <div>
          <h2 style={{ marginBottom:16, fontSize:18 }}>Crear pedido</h2>

          {/* Sub-step 0: Elegir restaurante */}
          {subStep === 0 && (
            <div>
              <p style={{ color:'var(--on-surface-variant)', marginBottom:14, fontSize:14 }}>
                Selecciona el restaurante:
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:400, overflowY:'auto' }}>
                {restaurantes.map(r => (
                  <button key={r.id} className="card" style={{ textAlign:'left', cursor:'pointer', border:'none', width:'100%' }}
                    onClick={() => elegirRestaurante(r)}>
                    <div style={{ fontWeight:700 }}>{r.nombre}</div>
                    <div style={{ fontSize:12, color:'var(--on-surface-variant)' }}>{r.tipo_comida} · {r.direccion}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-step 1: Configurar pedido */}
          {subStep === 1 && (
            <div className="card">
              <h3 style={{ marginBottom:16 }}>Configurar pedido</h3>
              <p style={{ fontSize:13, marginBottom:16, color:'var(--on-surface-variant)' }}>
                Restaurante: <strong>{selectedRestaurante?.nombre}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Distancia (km) *</label>
                <input className="form-input" type="number" min="0.1" step="0.1" value={distancia}
                  onChange={e => setDistancia(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={esFeriado} onChange={e => setEsFeriado(e.target.checked)}
                    style={{ marginRight:8 }} />
                  ¿Es día feriado? (₡1,500/km en lugar de ₡1,000/km)
                </label>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" onClick={() => setSubStep(0)}>Atrás</button>
                <button className="btn btn-primary" onClick={handleCrearPedido} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear pedido'}
                </button>
              </div>
            </div>
          )}

          {/* Sub-step 2: Agregar combos */}
          {subStep === 2 && (
            <div className="card">
              <h3 style={{ marginBottom:4 }}>Agregar combos</h3>
              <p style={{ fontSize:12, color:'var(--on-surface-variant)', marginBottom:16 }}>
                Pedido #{pedidoActual?.id || pedidoActual?.idPedido}
              </p>

              {detalles.length > 0 && (
                <div style={{ marginBottom:16, padding:12, background:'var(--surface-variant)', borderRadius:10 }}>
                  {detalles.map((d,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0' }}>
                      <span>x{d.cantidad} Combo {d.numero_combo} — {d.descripcion}</span>
                      <span style={{ fontWeight:700 }}>₡{(d.precio * d.cantidad).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Combo *</label>
                <select className="form-select" value={comboSel} onChange={e => setComboSel(e.target.value)}>
                  <option value="">-- Selecciona combo --</option>
                  {combos.map(c => (
                    <option key={c.id} value={c.id}>
                      Combo {c.numero_combo} — {c.descripcion} (₡{Number(c.precio).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad *</label>
                <input className="form-input" type="number" min="1" value={cantidad}
                  onChange={e => setCantidad(e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={handleAgregarDetalle} disabled={loading}>
                  <Plus size={14} /> Agregar combo
                </button>
                <button className="btn btn-primary" onClick={handleConfirmar} disabled={loading || detalles.length===0}>
                  {loading ? '...' : 'Confirmar pedido'}
                </button>
              </div>
            </div>
          )}

          {/* Sub-step 3: Pedido confirmado */}
          {subStep === 3 && (
            <div className="card">
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🚴</div>
                <h3>Pedido confirmado</h3>
                <p style={{ fontSize:13, color:'var(--on-surface-variant)', margin:'8px 0 20px' }}>
                  Repartidor asignado automáticamente
                </p>
                <button className="btn btn-primary" onClick={handleGenerarFactura} disabled={loading}>
                  {loading ? '...' : 'Generar factura'}
                </button>
              </div>
            </div>
          )}

          {/* Sub-step 4: Factura */}
          {subStep === 4 && factura && (
            <div className="card">
              <h3 style={{ marginBottom:16 }}>Factura #{factura.numero}</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  ['Subtotal', fmtColones(factura.subtotal)],
                  ['Transporte', fmtColones(factura.costo_transporte)],
                  ['IVA (13%)', fmtColones(factura.iva)],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                    <span style={{ color:'var(--on-surface-variant)' }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <div className="divider" style={{ margin:'8px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:18, color:'var(--primary)' }}>
                  <span>Total</span>
                  <span>{fmtColones(factura.total)}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-block" style={{ marginTop:16 }} onClick={resetPedido}>
                Nuevo pedido
              </button>
            </div>
          )}
        </div>

        {/* PEDIDOS DEL CLIENTE */}
        <div>
          <h2 style={{ marginBottom:16, fontSize:18 }}>Historial de pedidos</h2>
          {pedidos.length === 0 ? (
            <div className="empty-state" style={{ padding:'40px 0' }}>
              <ShoppingBag size={40} />
              <h3>Sin pedidos</h3>
              <p>Este cliente no tiene pedidos registrados.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:600, overflowY:'auto' }}>
              {pedidos.map(p => {
                const est = ESTADO_LABELS[p.estado] || { label:p.estado, cls:'badge-secondary', icon:'📦' };
                return (
                  <div key={p.id} className="card" style={{ padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <span style={{ fontWeight:700, fontFamily:'Poppins' }}>Pedido #{p.id}</span>
                      <span className={`badge ${est.cls}`}>{est.icon} {est.label}</span>
                    </div>
                    <p style={{ fontSize:12, color:'var(--on-surface-variant)', marginBottom:8 }}>
                      {new Date(p.hora_pedido).toLocaleString('es-CR')}
                    </p>
                    <div style={{ fontSize:13, display:'flex', gap:16 }}>
                      <span>Subtotal: {fmtColones(p.subtotal)}</span>
                      <span>Total: <strong style={{ color:'var(--primary)' }}>{fmtColones(p.total)}</strong></span>
                    </div>
                    {p.estado !== 'entregado' && p.estado !== 'suspendido' && (
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        {p.estado === 'en_preparacion' && (
                          <button className="btn btn-sm btn-secondary"
                            onClick={() => handleCambiarEstado(p.id, 'en_camino')}>
                            <Truck size={14} /> En camino
                          </button>
                        )}
                        {p.estado === 'en_camino' && (
                          <button className="btn btn-sm btn-primary"
                            onClick={() => handleCambiarEstado(p.id, 'entregado')}>
                            <CheckCircle size={14} /> Entregado
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
