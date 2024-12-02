import { config } from '../config';

const DEFAULT_AVATAR = '/uploads/avatars/default-avatar.png';

export function getAvatarUrl(path?: string): string {
  console.log('getAvatarUrl chamado com:', path);
  
  if (!path) {
    console.log('Sem path, retornando avatar padrão');
    return `${config.apiUrl}${DEFAULT_AVATAR}`;
  }
  
  if (path.startsWith('data:')) {
    console.log('Path é uma data URL');
    return path;
  }
  
  if (path.startsWith('http')) {
    console.log('Path é uma URL completa');
    return path;
  }
  
  // Se o caminho já começa com /uploads/, não adiciona novamente
  const normalizedPath = path.startsWith('/uploads/') 
    ? path 
    : `/uploads/${path}`;
      
  const fullUrl = `${config.apiUrl}/api${normalizedPath}`;
  
  console.log('Avatar URL construída:', {
    originalPath: path,
    normalizedPath: normalizedPath,
    fullUrl: fullUrl,
    config: {
      apiUrl: config.apiUrl,
      uploadsUrl: config.uploadsUrl
    }
  });
  
  return fullUrl;
}
