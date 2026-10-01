export function getStringUrlAvatar(userId: string): string {
  if (!userId) return '';

  const appBaseUrl = process.env.BASE_URL || 'http://localhost:3004';

  return `${appBaseUrl}/avatar/user/${userId}`;
}
