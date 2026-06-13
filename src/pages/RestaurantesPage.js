import React, { useEffect, useState } from 'react';
import { Plus, Search, MapPin, UtensilsCrossed, Store, Map, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRestaurantes, crearRestaurante, getCombos, crearCombo } from '../services/api';

const TIPOS = ['rapida','china','costarricense','saludable','italiana','mexicana','mariscos','otra'];
const EMPTY_REST = { nombre:'', cedula_juridica:'', direccion:'', tipo_comida:'rapida' };
const EMPTY_COMBO = { numero_combo:1, descripcion:'', precio:4000 };

const COMBO_PRECIOS = {1:4000,2:5000,3:6000,4:7000,5:8000,6:9000,7:10000,8:11000,9:12000};

// Simple Map embed via Google Maps Embed API (no key needed for embed iframes in many cases)
// We'll use a link to Google Maps instead to avoid key requirement
function RestauranteMap({ restaurante, onClose }) {
  const query = encodeURIComponent(`${restaurante.nombre}, ${restaurante.direccion}, Heredia, Costa Rica`);
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&z=15`;

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:720 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{restaurante.nombre}</h2>
            <p style={{ fontSize:13, color:'var(--on-surface-variant)', marginTop:2 }}>
              <MapPin size={13} style={{ display:'inline', marginRight:4 }} />
              {restaurante.direccion}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="map-container" style={{ height:380 }}>
          <iframe
            title="Mapa"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border:0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${query}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
          >
            <MapPin size={14} /> Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function MenuModal({ restaurante, onClose }) {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_COMBO);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCombos(restaurante.id)
      .then(d => setCombos(Array.isArray(d) ? d : []))
      .catch(() => setCombos([]))
      .finally(() => setLoading(false));
  }, [restaurante.id]);

  const handleNumeroChange = (n) => {
    setForm({ ...form, numero_combo: Number(n), precio: COMBO_PRECIOS[Number(n)] || 4000 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.descripcion) { toast.error('Agrega una descripción'); return; }
    setSaving(true);
    try {
      await crearCombo(restaurante.id, form);
      toast.success('Combo agregado');
      const data = await getCombos(restaurante.id);
      setCombos(Array.isArray(data) ? data : []);
      setShowForm(false);
      setForm(EMPTY_COMBO);
    } catch (e) { toast.error(e.message || 'Error'); } finally { setSaving(false); }
  };

  const fmtColones = (v) => `₡${Number(v).toLocaleString('es-CR')}`;

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:640 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Menú — {restaurante.nombre}</h2>
            <p style={{ fontSize:13, color:'var(--on-surface-variant)', marginTop:2 }}>
              <span className="restaurant-type-badge">{restaurante.tipo_comida}</span>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div style={{ maxHeight:360, overflowY:'auto', marginBottom:16 }}>
            {combos.length === 0 ? (
              <div className="empty-state" style={{ padding:'40px 20px' }}>
                <UtensilsCrossed size={40} />
                <h3>Sin combos</h3>
                <p>Agrega el primer combo a este restaurante.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gap:12 }}>
                {combos.map(c => (
                  <div key={c.id} className="combo-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div className="combo-number">{c.numero_combo}</div>
                        <p style={{ fontSize:14, color:'var(--on-surface)', margin:'6px 0 4px', fontWeight:600 }}>
                          {c.descripcion}
                        </p>
                      </div>
                      <div className="combo-price">{fmtColones(c.precio)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showForm ? (
          <>
            <div className="divider" />
            <h3 style={{ marginBottom:12, fontSize:16 }}>Agregar combo</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Número de combo *</label>
                  <select className="form-select" value={form.numero_combo}
                    onChange={e => handleNumeroChange(e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <option key={n} value={n}>Combo {n} — ₡{COMBO_PRECIOS[n].toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input className="form-input" value={`₡${form.precio.toLocaleString()}`} readOnly
                    style={{ background:'var(--surface-variant)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input className="form-input" value={form.descripcion}
                  onChange={e => setForm({...form, descripcion:e.target.value})}
                  placeholder="Ej: Hamburguesa + papas + refresco" />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Agregar combo'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <button className="btn btn-outline btn-block" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Agregar combo
          </button>
        )}
      </div>
    </div>
  );
}

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalNew, setModalNew] = useState(false);
  const [mapModal, setMapModal] = useState(null);
  const [menuModal, setMenuModal] = useState(null);
  const [form, setForm] = useState(EMPTY_REST);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRestaurantes();
      setRestaurantes(Array.isArray(data) ? data : []);
    } catch { setRestaurantes([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = restaurantes.filter(r =>
    r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.tipo_comida?.toLowerCase().includes(search.toLowerCase()) ||
    r.cedula_juridica?.includes(search)
  );

  const handleSave = async (e) => {
    e.preventDefault();
    const { nombre, cedula_juridica, direccion, tipo_comida } = form;
    if (!nombre || !cedula_juridica || !direccion || !tipo_comida) {
      toast.error('Completa todos los campos'); return;
    }
    setSaving(true);
    const payload = {
      nombre: nombre,
      cedulaJuridica: cedula_juridica,
      direccion: direccion,
      tipoComida: tipo_comida
    };
    try {
      await crearRestaurante(payload);
      toast.success('Restaurante registrado');
      setModalNew(false);
      setForm(EMPTY_REST);
      load();
    } catch (e) { toast.error(e.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Restaurantes</h1>
          <p className="page-subtitle">{restaurantes.length} restaurantes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalNew(true)}>
          <Plus size={18} /> Nuevo restaurante
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom:24 }}>
        <Search />
        <input placeholder="Buscar por nombre, tipo o cédula..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Store size={56} /><h3>Sin restaurantes</h3></div>
      ) : (
        <div className="card-grid">
          {filtered.map(r => (
            <div key={r.id} className="restaurant-card">
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                <div style={{
                  width:48, height:48, borderRadius:14,
                  background:'var(--primary-container)', color:'var(--primary)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, flexShrink:0
                }}>🍽️</div>
                <div style={{ flex:1 }}>
                  <span className="restaurant-type-badge">{r.tipo_comida}</span>
                  <h3 style={{ fontSize:17, marginTop:2 }}>{r.nombre}</h3>
                  <p style={{ fontSize:12, color:'var(--on-surface-variant)', marginTop:2 }}>
                    Cédula: {r.cedula_juridica}
                  </p>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16, fontSize:13, color:'var(--on-surface-variant)' }}>
                <MapPin size={14} style={{ flexShrink:0 }} />
                <span>{r.direccion}</span>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setMapModal(r)}>
                  <Map size={14} /> Mapa
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setMenuModal(r)}>
                  <UtensilsCrossed size={14} /> Ver Menú
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVO RESTAURANTE */}
      {modalNew && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModalNew(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Restaurante</h2>
              <button className="modal-close" onClick={() => setModalNew(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.nombre}
                  onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Nombre del restaurante" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cédula Jurídica *</label>
                  <input className="form-input" value={form.cedula_juridica}
                    onChange={e => setForm({...form, cedula_juridica:e.target.value})} placeholder="3-101-000001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de comida *</label>
                  <select className="form-select" value={form.tipo_comida}
                    onChange={e => setForm({...form, tipo_comida:e.target.value})}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dirección *</label>
                <input className="form-input" value={form.direccion}
                  onChange={e => setForm({...form, direccion:e.target.value})} placeholder="Dirección completa" />
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

      {mapModal && <RestauranteMap restaurante={mapModal} onClose={() => setMapModal(null)} />}
      {menuModal && <MenuModal restaurante={menuModal} onClose={() => setMenuModal(null)} />}
    </div>
  );
}
