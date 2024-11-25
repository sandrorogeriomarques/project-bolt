const API_URL = 'http://localhost:3001';
const DEFAULT_AVATAR = '/uploads/avatars/default-avatar.png';

export function getAvatarUrl(path?: string): string {
  if (!path) return DEFAULT_AVATAR;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http')) return path;
  return `${API_URL}/${path.replace(/^\/+/, '')}`;
}
