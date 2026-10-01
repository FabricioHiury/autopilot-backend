export function generateStringUrlImagePublic(params: {
  imageId: string;
}): string {
  const appBaseUrl = process.env.BASE_URL || 'http://localhost:3004';

  return `${appBaseUrl}/faq/imagens/${params.imageId}`;
}
