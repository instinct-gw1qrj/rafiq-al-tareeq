// Qibla direction by great-circle math — works fully offline.

const RAD = Math.PI / 180;

/** The Kaaba in Makkah. */
export const KAABA = { lat: 21.4224779, lng: 39.8262132 };

/**
 * Bearing from any point on earth to the Kaaba, in degrees clockwise from true north.
 * Cairo ≈ ١٣٦°, Alexandria ≈ ١٣٤°, Aswan ≈ ١١٧°.
 */
export function qiblaBearing(lat: number, lng: number): number {
  const phi1 = lat * RAD;
  const phi2 = KAABA.lat * RAD;
  const dLng = (KAABA.lng - lng) * RAD;
  const y = Math.sin(dLng);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng);
  return ((Math.atan2(y, x) / RAD) + 360) % 360;
}
