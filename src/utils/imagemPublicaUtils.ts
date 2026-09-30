export function gerarStringUrlImagemPublica(params: {
  imagemId: string;
}): string {
  const appBaseUrl = process.env.BASE_URL || 'http://localhost:3004';

  return `${appBaseUrl}/faq/imagens/${params.imagemId}`;
}
