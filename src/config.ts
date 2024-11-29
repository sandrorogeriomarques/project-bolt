const API_PORT = 8081;
const VITE_PORT = 5173;
const API_HOST = import.meta.env.PROD ? '192.168.15.8' : 'localhost';

// URLs base para diferentes serviços
const API_URL = `http://${API_HOST}:${API_PORT}`;
const FRONTEND_URL = `http://${API_HOST}:${VITE_PORT}`;

export const config = {
  apiUrl: API_URL,
  uploadsUrl: API_URL,
  frontendUrl: FRONTEND_URL,
  baserowToken: '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI'
};
