export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://192.168.15.8:8081',
  baserowApiUrl: import.meta.env.VITE_BASEROW_API_URL || 'https://api.baserow.io/api',
  baserowToken: import.meta.env.VITE_BASEROW_TOKEN || '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI',
  restaurantsTableId: import.meta.env.VITE_BASEROW_RESTAURANTS_TABLE_ID || '399121',
  usersTableId: import.meta.env.VITE_BASEROW_USERS_TABLE_ID || '396313',
};
