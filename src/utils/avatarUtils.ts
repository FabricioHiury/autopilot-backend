export function getStringUrlAvatar(usuarioId: string): string {
  if (!usuarioId) return '';

  const appBaseUrl = process.env.BASE_URL || 'http://localhost:3004';

  return `${appBaseUrl}/avatar/usuario/${usuarioId}`;
}
