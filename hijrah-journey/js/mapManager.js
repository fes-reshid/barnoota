/* ===================== Map Manager =====================
   Renders the stylized overview map (Makkah -> Jabal Thawr -> Desert
   Route -> Quba -> Madinah) as an SVG string, lighting up each stop as
   the party reaches it. This is a separate summary screen from the
   live gameplay canvas -- it shows overall progress, not real-time
   player positions. */

const NODES = [
  { label: 'MAKKAH', icon: '🏛️', x: 60, y: 160 },
  { label: 'JABAL THAWR', icon: '⛰️', x: 190, y: 55 },
  { label: 'DESERT ROUTE', icon: '🏜️', x: 330, y: 175 },
  { label: 'QUBA', icon: '🕌', x: 470, y: 60 },
  { label: 'MADINAH', icon: '🌴', x: 560, y: 150 }
];

function pathD(){
  let d = 'M ' + NODES[0].x + ' ' + NODES[0].y;
  for(let i = 1; i < NODES.length; i++) d += ' L ' + NODES[i].x + ' ' + NODES[i].y;
  return d;
}

export function renderMapSVG(stopsReached){
  const nodesHtml = NODES.map((n, i) => {
    const reached = i < stopsReached;
    const fill = reached ? '#2e6b58' : '#fff';
    const stroke = reached ? '#1f4f40' : '#d3ac5c';
    const textColor = reached ? '#1f4f40' : '#8a7654';
    return (
      '<circle cx="' + n.x + '" cy="' + n.y + '" r="22" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"></circle>' +
      '<text x="' + n.x + '" y="' + (n.y + 7) + '" text-anchor="middle" font-size="20">' + n.icon + '</text>' +
      '<text x="' + n.x + '" y="' + (n.y + 42) + '" text-anchor="middle" font-size="12" font-family="Marcellus, serif" fill="' + textColor + '" font-weight="700">' + n.label + '</text>'
    );
  }).join('');

  return (
    '<svg viewBox="0 0 620 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">' +
      '<path d="' + pathD() + '" fill="none" stroke="#d3ac5c" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"></path>' +
      nodesHtml +
    '</svg>'
  );
}
