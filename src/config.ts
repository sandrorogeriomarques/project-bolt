const API_PORT = 8081;
const VITE_PORT = 5173;
const API_HOST = 'localhost';  // Always use localhost in development

// URLs base para diferentes serviços
const API_URL = `http://${API_HOST}:${API_PORT}`;  // Use absolute URL for API
const FRONTEND_URL = `http://${API_HOST}:${VITE_PORT}`;

export const config = {
  apiUrl: API_URL,
  uploadsUrl: API_URL,
  frontendUrl: FRONTEND_URL,
  baserowToken: '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI'
};
