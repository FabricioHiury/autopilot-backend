export class GoogleMapsUtils {
  static generateMapsUrl(lat: number, lng: number, name?: string): string {
    const baseUrl = 'https://www.google.com/maps';
    
    if (name) {
      return `${baseUrl}/place/${encodeURIComponent(name)}/@${lat},${lng},17z`;
    } else {
      return `${baseUrl}/@${lat},${lng},17z`;
    }
  }

  static generateSearchUrl(address: string): string {
    return `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
  }
}