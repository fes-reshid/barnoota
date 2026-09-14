/* ===================== Save System =====================
   Everything persisted to the browser's localStorage: completed levels,
   best times, good deeds discovered, learning cards viewed, and
   settings. Nothing here leaves the browser. */

const KEY = 'race-good-deed-save-v1';

function defaults(){
  return {
    completedLevels: [],
    bestTimes: {},
    goodDeedsDiscovered: [],
    libraryCardsViewed: [],
    settings: null
  };
}

export function loadSave(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  }catch(e){ return defaults(); }
}

export function saveSave(data){
  try{ localStorage.setItem(KEY, JSON.stringify(data)); return true; }catch(e){ return false; }
}

export function markLevelComplete(levelId, timeSeconds){
  const data = loadSave();
  if(!data.completedLevels.includes(levelId)) data.completedLevels.push(levelId);
  if(!data.bestTimes[levelId] || timeSeconds < data.bestTimes[levelId]) data.bestTimes[levelId] = timeSeconds;
  saveSave(data);
  return data;
}

export function markGoodDeedDiscovered(goodDeedId){
  const data = loadSave();
  if(!data.goodDeedsDiscovered.includes(goodDeedId)) data.goodDeedsDiscovered.push(goodDeedId);
  saveSave(data);
  return data;
}

export function markLibraryCardViewed(cardId){
  const data = loadSave();
  if(!data.libraryCardsViewed.includes(cardId)) data.libraryCardsViewed.push(cardId);
  saveSave(data);
  return data;
}

export function saveSettings(settings){
  const data = loadSave();
  data.settings = settings;
  saveSave(data);
}

export function resetProgress(){
  try{ localStorage.removeItem(KEY); }catch(e){}
}

export function isLevelUnlocked(levelId, levels){
  const data = loadSave();
  const idx = levels.findIndex(l => l.id === levelId);
  if(idx <= 0) return true;
  return data.completedLevels.includes(levels[idx - 1].id);
}
