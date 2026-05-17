import React, { useEffect, useState } from 'react';
import { Plus, Search, Bike, AlertTriangle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRepartidores, crearRepartidor, getQuejas, crearQueja, agregarAmonestacion } from '../services/api';

const EMPTY_REP = { cedula:'', nombre:'', correo:'', direccion:'', telefono:'', numero_tarjeta:'' };

export default function RepartidoresPage() {
  const [repartidores, setRepartidores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalNew, setModalNew] = useState(false);
  const [modalQuejas, setModalQuejas] = useState(null);
  const [form, setForm] = useState(EMPTY_REP);
  const [quejas, setQuejas] = useState([]);
  const [nuevaQueja, setNuevaQueja] = useState({ descripcion:'', id_cliente:'' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRepartidores();
      setRepartidores(Array.isArray(data) ? data : []);
    } catch { setRepartidores([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = repartidores.filter(r =>
    r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.cedula?.includes(search)
  );

  const handleSave = async (e) => {
    e.preventDefault();
    const { cedula, nombre, correo, direccion, telefono, numero_tarjeta } = form;
    if (!cedula || !nombre || !correo || !direccion || !telefono || !numero_tarjeta) {
      toast.error('Completa todos los campos'); return;
    }
    setSaving(true);
    try {
      await crearRepartidor(form);
      toast.success('Repartidor registrado');
      setModalNew(false); setForm(EMPTY_REP); load();
    } catch (e) { toast.error(e.message || 'Error'); } finally { setSaving(false); }
  };

  const openQuejas = async (rep) => {
    setModalQuejas(rep);
    try {
      const data = await getQuejas(rep.id);
      setQuejas(Array.isArray(data) ? data : []);
    } catch { setQuejas([]); }
  };

  const handleQueja = async (e) => {
    e.preventDefault();
    if (!nuevaQueja.descripcion || !nuevaQueja.id_cliente) { toast.error('Completa la descripción y ID del cliente'); return; }
    try {
      await crearQueja(modalQuejas.id, nuevaQueja);
      toast.success('Queja registrada');
      setNuevaQueja({ descripcion:'', id_cliente:'' });
      openQuejas(modalQuejas);
    } catch (e) { toast.error(e.message || 'Error'); }
  };

  const handleAmonestacion = async (id) => {
    try {
      await agregarAmonestacion(id);
      toast.success('Amonestación agregada');
      load();
    } catch (e) { toast.error(e.message || 'Error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Repartidores</h1>
          <p className="page-subtitle">{repartidores.length} repartidores registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalNew(true)}>
          <Plus size={18} /> Nuevo repartidor
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom:24 }}>
        <Search />
        <input placeholder="Buscar por nombre o cédula..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Bike size={56} /><h3>Sin repartidores</h3></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Repartidor</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Amonestaciones</th>
                <th>Km diarios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:34, height:34, borderRadius:10,
                        background:'#E8F5E9', color:'#2E7D32',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontWeight:800, fontSize:14, fontFamily:'Poppins,sans-serif', flexShrink:0
                      }}>{(r.nombre||'?')[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight:700 }}>{r.nombre}</div>
                        <div style={{ fontSize:12, color:'var(--on-surface-variant)' }}>{r.correo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{r.cedula}</td>
                  <td>{r.telefono}</td>
                  <td>
                    <span className={`badge ${r.estado==='disponible'?'badge-success':'badge-warning'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.num_amonestaciones>=3?'badge-danger':'badge-secondary'}`}>
                      {r.num_amonestaciones || 0}
                    </span>
                  </td>
                  <td>{r.km_diarios || 0} km</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-ghost" onClick={() => openQuejas(r)} title="Ver quejas">
                        <MessageSquare size={14} /> Quejas
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleAmonestacion(r.id)} title="Agregar amonestación">
                        <AlertTriangle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL NUEVO */}
      {modalNew && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModalNew(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Repartidor</h2>
              <button className="modal-close" onClick={() => setModalNew(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.nombre}
                    onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Nombre completo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cédula *</label>
                  <input className="form-input" value={form.cedula}
                    onChange={e => setForm({...form, cedula:e.target.value})} placeholder="1-1111-1111" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Correo *</label>
                <input className="form-input" type="email" value={form.correo}
                  onChange={e => setForm({...form, correo:e.target.value})} placeholder="correo@ejemplo.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección *</label>
                <input className="form-input" value={form.direccion}
                  onChange={e => setForm({...form, direccion:e.target.value})} placeholder="Dirección completa" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Teléfono *</label>
                  <input className="form-input" value={form.telefono}
                    onChange={e => setForm({...form, telefono:e.target.value})} placeholder="88881111" />
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Tarjeta *</label>
                  <input className="form-input" value={form.numero_tarjeta}
                    onChange={e => setForm({...form, numero_tarjeta:e.target.value})} placeholder="4000..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalNew(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUEJAS */}
      {modalQuejas && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModalQuejas(null)}>
          <div className="modal" style={{ maxWidth:600 }}>
            <div className="modal-header">
              <h2 className="modal-title">Quejas — {modalQuejas.nombre}</h2>
              <button className="modal-close" onClick={() => setModalQuejas(null)}>✕</button>
            </div>

            <div style={{ maxHeight:200, overflowY:'auto', marginBottom:20 }}>
              {quejas.length === 0 ? (
                <p style={{ color:'var(--on-surface-variant)', fontSize:14 }}>Sin quejas registradas.</p>
              ) : quejas.map(q => (
                <div key={q.id} style={{
                  padding:12, borderRadius:10, border:'1.5px solid var(--outline-variant)',
                  marginBottom:8, fontSize:14
                }}>
                  <p style={{ fontWeight:600 }}>{q.descripcion}</p>
                  <p style={{ fontSize:12, color:'var(--on-surface-variant)', marginTop:4 }}>
                    {new Date(q.fecha).toLocaleString('es-CR')} · Cliente ID {q.id_cliente}
                  </p>
                </div>
              ))}
            </div>

            <div className="divider" />
            <h3 style={{ marginBottom:12, fontSize:16 }}>Registrar nueva queja</h3>
            <form onSubmit={handleQueja}>
              <div className="form-group">
                <label className="form-label">ID del Cliente *</label>
                <input className="form-input" type="number" value={nuevaQueja.id_cliente}
                  onChange={e => setNuevaQueja({...nuevaQueja, id_cliente:e.target.value})} placeholder="ID del cliente" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <textarea className="form-textarea" value={nuevaQueja.descripcion}
                  onChange={e => setNuevaQueja({...nuevaQueja, descripcion:e.target.value})}
                  placeholder="Describe la queja..." />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Registrar queja</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
