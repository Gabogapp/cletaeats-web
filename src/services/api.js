const BASE_URL = 'https://cletaeats-backend-production.up.railway.app';

const request = async (method, path, body = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(data?.mensaje || data?.error || `Error ${res.status}`);
  return data;
};

// ── CLIENTES ──────────────────────────────────────────────────
export const getClientes = () => request('GET', '/clientes');
export const getClientesSuspendidos = () => request('GET', '/clientes/suspendidos');
export const getClienteByCedula = (cedula) => request('GET', `/clientes/cedula/${cedula}`);
export const verificarCliente = (cedula) => request('GET', `/clientes/verificar/${cedula}`);
export const crearCliente = (data) => request('POST', '/clientes', data);
export const activarCliente = (id) => request('PATCH', `/clientes/${id}/activar`);
export const suspenderCliente = (id) => request('PATCH', `/clientes/${id}/suspender`);

// ── REPARTIDORES ──────────────────────────────────────────────
export const getRepartidores = () => request('GET', '/repartidores/todos');
export const getRepartidorDisponible = () => request('GET', '/repartidores/disponible');
export const crearRepartidor = (data) => request('POST', '/repartidores', data);
export const getQuejas = (id) => request('GET', `/repartidores/${id}/quejas`);
export const crearQueja = (id, data) => request('POST', `/repartidores/${id}/quejas`, data);
export const agregarAmonestacion = (id) => request('POST', `/repartidores/${id}/amonestaciones`);

// ── RESTAURANTES ──────────────────────────────────────────────
export const getRestaurantes = () => request('GET', '/restaurantes');
export const crearRestaurante = (data) => request('POST', '/restaurantes', data);
export const getCombos = (id) => request('GET', `/restaurantes/${id}/combos`);
export const crearCombo = (id, data) => request('POST', `/restaurantes/${id}/combos`, data);

// ── PEDIDOS ───────────────────────────────────────────────────
export const crearPedido = (data) => request('POST', '/pedidos', data);
export const agregarDetalle = (id, data) => request('POST', `/pedidos/${id}/detalles`, data);
export const confirmarPedido = (id) => request('POST', `/pedidos/${id}/confirmar`);
export const cambiarEstado = (id, data) => request('PATCH', `/pedidos/${id}/estado`, data);
export const generarFactura = (id) => request('POST', `/pedidos/${id}/factura`);
export const getPedidosCliente = (id) => request('GET', `/pedidos/cliente/${id}`);

// ── REPORTES ──────────────────────────────────────────────────
export const reporteMayorPedidos = () => request('GET', '/reportes/restaurante-mayor-pedidos');
export const reporteMenorPedidos = () => request('GET', '/reportes/restaurante-menor-pedidos');
export const reporteMontosPorRestaurante = () => request('GET', '/reportes/montos-por-restaurante');
export const reporteMontoTotal = () => request('GET', '/reportes/monto-total');
export const reporteClienteMayorPedidos = () => request('GET', '/reportes/cliente-mayor-pedidos');
export const reporteHoraPico = () => request('GET', '/reportes/hora-pico');
