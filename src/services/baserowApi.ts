import axios from 'axios';

const BASEROW_API_URL = import.meta.env.VITE_BASEROW_API_URL;
const BASEROW_TOKEN = import.meta.env.VITE_BASEROW_TOKEN;

if (!BASEROW_API_URL) {
  throw new Error('VITE_BASEROW_API_URL não encontrada');
}

if (!BASEROW_TOKEN) {
  throw new Error('VITE_BASEROW_TOKEN não encontrada');
}

export const baserowApi = axios.create({
  baseURL: BASEROW_API_URL,
  headers: {
    'Authorization': `Token ${BASEROW_TOKEN}`,
    'Content-Type': 'application/json'
  }
});
