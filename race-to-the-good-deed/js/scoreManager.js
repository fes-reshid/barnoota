/* ===================== Score Manager =====================
   Turns what happened during the race into three friendly 1-5 star
   ratings per player -- Speed, Kindness, Teamwork -- never a single
   "1st place is the best person" verdict. Every player always gets at
   least 3 stars in every category: the point is encouragement, not a
   harsh grade. */

const MIN_STARS = 3;
const MAX_STARS = 5;

function bucket(count, thresholds){
  let stars = MIN_STARS;
  thresholds.forEach((t, i) => { if(count >= t) stars = MIN_STARS + i + 1; });
  return Math.min(MAX_STARS, stars);
}

export function computeResults(racers, rankings){
  return racers.map(racer => {
    const rankEntry = rankings.find(r => r.racer === racer);
    const rank = rankEntry ? rankEntry.rank : racers.length;

    const speedStars = rank === 1 ? 5 : 4;

    const kindnessCount = racer.correctChoices + (racer.tokens.kindness || 0) + (racer.tokens.helping || 0);
    const kindnessStars = bucket(kindnessCount, [1, 2]);

    const teamworkCount = racer.helpedCount + (racer.tokens.teamwork || 0);
    const teamworkStars = bucket(teamworkCount, [1, 2]);

    return {
      racer,
      character: racer.character,
      rank,
      speedStars,
      kindnessStars,
      teamworkStars
    };
  });
}

export function starsToText(n){
  return '⭐'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
}
