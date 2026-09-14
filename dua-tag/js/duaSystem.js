/* ===================== Du'a System =====================
   Holds which du'a is currently being shown to a tagged player and picks
   the next one, without knowing anything about rendering, players, or
   tagging mechanics. */

import { pickRandomDua } from './duaLibraryData.js';

export class DuaSystem {
  constructor(){
    this.recentIds = [];
    this.currentDua = null;
    this.isOpen = false;
  }

  openForTag(){
    this.currentDua = pickRandomDua(this.recentIds);
    this.recentIds.push(this.currentDua.id);
    if(this.recentIds.length > 3) this.recentIds.shift();
    this.isOpen = true;
    return this.currentDua;
  }

  close(){
    this.isOpen = false;
    this.currentDua = null;
  }
}
