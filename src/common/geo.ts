// Tọa độ & khoảng cách — dùng chung cho seed và các endpoint tin tuyển dụng.

/** Tọa độ gần đúng trung tâm các quận/huyện Đà Nẵng (chỉ để minh họa khoảng cách) */
export const DISTRICT_GEO: Record<string, { lat: number; lng: number }> = {
  'Hải Châu': { lat: 16.0678, lng: 108.2208 },
  'Thanh Khê': { lat: 16.0712, lng: 108.1887 },
  'Sơn Trà': { lat: 16.0997, lng: 108.2455 },
  'Ngũ Hành Sơn': { lat: 16.0036, lng: 108.2606 },
  'Liên Chiểu': { lat: 16.0967, lng: 108.1442 },
  'Cẩm Lệ': { lat: 16.0239, lng: 108.2036 },
  'Hòa Vang': { lat: 15.9967, lng: 108.1167 },
}

/** Điểm mốc khi người xem chưa có tọa độ: trung tâm Hải Châu */
export const DANANG_CENTER = DISTRICT_GEO['Hải Châu']

/** Lệch nhỏ cố định theo id để các điểm cùng quận không chồng lên nhau */
export function jitter(id: string, base: number): number {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return base + ((h % 81) - 40) * 0.0001
}

/** Tọa độ theo tên quận ("Hải Châu" hoặc "Hải Châu, Đà Nẵng"); lạ → null */
export function geo(district: string, id: string): { lat: number | null; lng: number | null } {
  const g = DISTRICT_GEO[district.split(',')[0].trim()]
  return g ? { lat: jitter(id, g.lat), lng: jitter(id + '#', g.lng) } : { lat: null, lng: null }
}

/** Khoảng cách đường chim bay (km) giữa hai điểm — công thức haversine */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
