import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, User } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getClientes, getClientesSuspendidos, crearCliente,
  activarCliente, suspenderCliente
} from '../services/api';

const EMPTY = { cedula:'', nombre:'', direccion:'', telefono:'', correo:'', numero_tarjeta:'' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [tab, setTab] = useState('activos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = tab === 'activos' ? await getClientes() : await getClientesSuspendidos();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Error cargando clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const filtered = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.cedula?.includes(search) ||
    c.correo?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditData(EMPTY); setModal(true); };
  const closeModal = () => { setModal(false); setEditData(EMPTY); };

  const handleSave = async (e) => {
    e.preventDefault();
    const { cedula, nombre, direccion, telefono, correo } = editData;
    if (!cedula || !nombre || !direccion || !telefono || !correo) {
      toast.error('Completa todos los campos obligatorios'); return;
    }
    setSaving(true);
    try {
      await crearCliente(editData);
      toast.success('Cliente registrado');
      closeModal();
      load();
    } catch (e) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (c) => {
    try {
      if (c.estado === 'activo') {
        await suspenderCliente(c.id);
        toast.success(`${c.nombre} suspendido`);
      } else {
        await activarCliente(c.id);
        toast.success(`${c.nombre} activado`);
      }
      load();
    } catch (e) {
      toast.error(e.message || 'Error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes {tab}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div className="tabs" style={{ marginBottom:0 }}>
          <button className={`tab ${tab==='activos'?'active':''}`} onClick={() => setTab('activos')}>Activos</button>
          <button className={`tab ${tab==='suspendidos'?'active':''}`} onClick={() => setTab('suspendidos')}>Suspendidos</button>
        </div>
        <div className="search-bar">
          <Search />
          <input
            placeholder="Buscar por nombre, cédula o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <User size={56} />
          <h3>Sin clientes</h3>
          <p>No hay clientes {tab} para mostrar.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:34, height:34, borderRadius:10,
                        background:'var(--primary-container)', color:'var(--primary)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontWeight:800, fontSize:14, fontFamily:'Poppins,sans-serif', flexShrink:0
                      }}>
                        {(c.nombre||'?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700 }}>{c.nombre}</div>
                        <div style={{ fontSize:12, color:'var(--on-surface-variant)' }}>{c.direccion}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:13 }}>{c.cedula}</td>
                  <td>{c.correo}</td>
                  <td>{c.telefono}</td>
                  <td>
                    <span className={`badge ${c.estado==='activo'?'badge-success':'badge-danger'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`btn btn-sm ${c.estado==='activo'?'btn-danger':'btn-ghost'}`}
                        onClick={() => toggleEstado(c)}
                        title={c.estado==='activo'?'Suspender':'Activar'}
                      >
                        {c.estado==='activo' ? <><UserX size={14}/> Suspender</> : <><UserCheck size={14}/> Activar</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Cliente</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={editData.nombre}
                    onChange={e => setEditData({...editData, nombre:e.target.value})} placeholder="Nombre completo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cédula *</label>
                  <input className="form-input" value={editData.cedula}
                    onChange={e => setEditData({...editData, cedula:e.target.value})} placeholder="1-1111-1111" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dirección *</label>
                <input className="form-input" value={editData.direccion}
                  onChange={e => setEditData({...editData, direccion:e.target.value})} placeholder="Dirección completa" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Teléfono *</label>
                  <input className="form-input" value={editData.telefono}
                    onChange={e => setEditData({...editData, telefono:e.target.value})} placeholder="88881111" />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo *</label>
                  <input className="form-input" type="email" value={editData.correo}
                    onChange={e => setEditData({...editData, correo:e.target.value})} placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Número de Tarjeta</label>
                <input className="form-input" value={editData.numero_tarjeta}
                  onChange={e => setEditData({...editData, numero_tarjeta:e.target.value})} placeholder="4000 0000 0000 0000 (opcional)" />
              </div>
              <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
