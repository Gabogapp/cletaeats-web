import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, User, Bike } from 'lucide-react';

const BASE_URL = 'https://cletaeats-backend-production.up.railway.app';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ usuario: '', contrasena: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.contrasena) { toast.error('Completa todos los campos'); return; }
    setLoading(true);
    try {
      // Try the login endpoint
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (res.ok && data) {
        localStorage.setItem('cletaeats_user', JSON.stringify(data));
        toast.success('¡Bienvenido a CletaEats!');
        navigate('/dashboard');
      } else {
        toast.error(data?.mensaje || data?.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{
            width:80, height:80, borderRadius:20,
            background:'linear-gradient(135deg,#FF6B00,#E05E00)',
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:14, boxShadow:'0 8px 24px rgba(255,107,0,0.4)'
          }}>
            <Bike size={40} color="white" />
          </div>
          <h1>CletaEats</h1>
          <p>Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div style={{ position:'relative' }}>
              <User size={16} style={{
                position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                color:'var(--on-surface-variant)'
              }} />
              <input
                className="form-input"
                style={{ paddingLeft:38 }}
                placeholder="Tu usuario"
                value={form.usuario}
                onChange={e => setForm({ ...form, usuario: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{
                position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                color:'var(--on-surface-variant)'
              }} />
              <input
                className="form-input"
                style={{ paddingLeft:38 }}
                type="password"
                placeholder="Tu contraseña"
                value={form.contrasena}
                onChange={e => setForm({ ...form, contrasena: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop:8 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'var(--on-surface-variant)' }}>
          EIF-411 • Universidad Nacional • I ciclo 2026
        </p>
      </div>
    </div>
  );
}
