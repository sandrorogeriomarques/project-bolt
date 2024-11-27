import { config } from '../config';

const DEFAULT_AVATAR = '/uploads/avatars/default-avatar.png';

export function getAvatarUrl(path?: string): string {
  if (!path) return `${config.apiUrl}${DEFAULT_AVATAR}`;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http')) return path;
  return `${config.apiUrl}/${path.replace(/^\/+/, '')}`;
}
