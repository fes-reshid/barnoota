/* ===================== Save System =====================
   Saves and restores progress in the browser's localStorage, so a
   child can close the game and come back to previously discovered
   locations later. Nothing here leaves the browser. */

const KEY = 'hijrah-journey-save-v1';

export function saveProgress(state){
  try{
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  }catch(e){ return false; }
}

export function loadProgress(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

export function clearProgress(){
  try{ localStorage.removeItem(KEY); }catch(e){}
}

export function hasSavedProgress(){
  try{ return localStorage.getItem(KEY) !== null; }catch(e){ return false; }
}
