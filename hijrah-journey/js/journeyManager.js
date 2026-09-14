/* ===================== Journey Manager =====================
   Tracks overall progress through the whole adventure: which stage the
   party is on, which landmarks have been discovered so far, and the
   location/"distance remaining" text shown in the HUD. Doesn't know how
   to render anything -- gameManager and uiManager read this state. */

export const STAGES = [
  'intro',
  'makkah-thawr',
  'cave',
  'desert-route',
  'quba',
  'madinah-arrival',
  'final-quiz',
  'ending'
];

export const STAGE_LOCATION_LABEL = {
  intro: 'Makkah',
  'makkah-thawr': 'Leaving Makkah',
  cave: 'Jabal Thawr',
  'desert-route': 'The Desert Route',
  quba: 'Quba',
  'madinah-arrival': 'Madinah',
  'final-quiz': 'Madinah',
  ending: 'Madinah'
};

const TOTAL_MAJOR_STOPS = 5; // Makkah, Jabal Thawr, Desert Route, Quba, Madinah

export class JourneyManager {
  constructor(){
    this.stageIndex = 0;
    this.discoveredLandmarks = new Set();
  }

  get stage(){ return STAGES[this.stageIndex]; }

  locationLabel(){ return STAGE_LOCATION_LABEL[this.stage] || ''; }

  majorStopsReached(){
    // Makkah (1) is always reached; each later stop is reached once the
    // stage index moves past the chapter that leads to it.
    let count = 1;
    if(this.stageIndex >= STAGES.indexOf('desert-route')) count++; // Jabal Thawr reached
    if(this.stageIndex >= STAGES.indexOf('quba')) count++;          // Desert Route reached
    if(this.stageIndex >= STAGES.indexOf('madinah-arrival')) count++; // Quba reached
    if(this.stageIndex >= STAGES.indexOf('final-quiz')) count++;    // Madinah reached
    return Math.min(count, TOTAL_MAJOR_STOPS);
  }

  distanceLabel(){
    return this.majorStopsReached() + ' of ' + TOTAL_MAJOR_STOPS + ' stops';
  }

  discover(landmarkId){
    this.discoveredLandmarks.add(landmarkId);
  }

  isDiscovered(landmarkId){
    return this.discoveredLandmarks.has(landmarkId);
  }

  advance(){
    if(this.stageIndex < STAGES.length - 1) this.stageIndex++;
  }

  restoreFrom(saved){
    if(!saved) return;
    if(typeof saved.stageIndex === 'number') this.stageIndex = saved.stageIndex;
    if(Array.isArray(saved.discoveredLandmarks)) this.discoveredLandmarks = new Set(saved.discoveredLandmarks);
  }

  serialize(){
    return {
      stageIndex: this.stageIndex,
      discoveredLandmarks: Array.from(this.discoveredLandmarks)
    };
  }
}
