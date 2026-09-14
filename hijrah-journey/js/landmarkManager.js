/* ===================== Landmark Manager =====================
   Defines where each chapter's landmarks sit on its 900x520 map, and
   detects when any rider gets close enough to trigger one. A landmark
   only needs ONE rider to reach it -- the whole party pauses together
   for the resulting learning moment, since this is a cooperative
   journey, not a race to be first. */

export const CHAPTER_LANDMARKS = {
  'makkah-thawr': [
    { id: 'cave-entrance', name: 'Jabal Thawr', x: 820, y: 260, r: 55, kind: 'cave' }
  ],
  'desert-route': [
    { id: 'why-hijrah', name: 'Why Leave Makkah?', x: 260, y: 140, r: 42, kind: 'minor' },
    { id: 'tired-camel-zone', name: 'A Tired Camel', x: 480, y: 400, r: 55, kind: 'teamwork' },
    { id: 'city-of-two-names', name: 'A City With Two Names', x: 650, y: 150, r: 42, kind: 'minor' },
    { id: 'quba-entrance', name: 'Onward to Quba', x: 830, y: 260, r: 55, kind: 'exit' }
  ],
  'quba': [
    { id: 'quba-mosque', name: 'Masjid Quba', x: 820, y: 260, r: 55, kind: 'quba' }
  ]
};

export function checkLandmarkProximity(riders, landmarks, discoveredIds){
  for(const lm of landmarks){
    if(discoveredIds.has(lm.id)) continue;
    const hit = riders.some(r => Math.hypot(r.x - lm.x, r.y - lm.y) < lm.r + r.radius * 0.6);
    if(hit) return lm;
  }
  return null;
}
