import axios from 'axios';

const BASEROW_API_URL = import.meta.env.VITE_BASEROW_API_URL || 'https://api.baserow.io/api';
const BASEROW_TOKEN = import.meta.env.VITE_BASEROW_TOKEN || '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';

export const baserowApi = axios.create({
  baseURL: BASEROW_API_URL,
  headers: {
    'Authorization': `Token ${BASEROW_TOKEN}`,
    'Content-Type': 'application/json'
  }
});
