/* ===================== Teamwork System =====================
   The cooperative gate: four parts, one for each character's ability,
   all needed before the gate opens. It reuses each character's normal
   ability mechanic (Malik still just breaks a rock, Amira still just
   activates a switch) at four specific spots, rather than inventing a
   second set of controls just for this moment. */

export function updateTeamworkGate(level, racers, now){
  const gate = level.teamworkGate;
  if(!gate || gate.completed) return { justCompleted: false, newlyDoneRacers: [] };

  const newlyDoneRacers = [];

  gate.parts.forEach(part => {
    if(part.done) return;
    if(part.ability === 'speed'){
      const zayd = racers.find(r => r.character.id === 'zayd');
      if(zayd && zayd._boosted && Math.abs(zayd.x - part.x) < 60){ part.done = true; newlyDoneRacers.push(zayd); }
    } else if(part.ability === 'flight'){
      const layla = racers.find(r => r.character.id === 'layla');
      if(layla && layla.flying && Math.abs(layla.x - part.x) < 60 && layla.y < part.y + 40){ part.done = true; newlyDoneRacers.push(layla); }
    } else if(part.ability === 'power'){
      const rock = (level.rocks || []).find(r => r.id === part.rockId);
      if(rock && rock.broken){ part.done = true; newlyDoneRacers.push(racers.find(r => r.character.id === 'malik')); }
    } else if(part.ability === 'hammer'){
      const sw = (level.switches || []).find(s => s.id === part.switchId);
      if(sw && sw.activated){ part.done = true; newlyDoneRacers.push(racers.find(r => r.character.id === 'amira')); }
    }
  });

  const allDone = gate.parts.every(p => p.done);
  if(allDone) gate.completed = true;

  return { justCompleted: allDone, newlyDoneRacers };
}
