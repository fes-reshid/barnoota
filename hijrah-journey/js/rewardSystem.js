/* ===================== Reward System =====================
   Journey Stars are a single shared party total, never a per-player
   competitive score -- the whole point of this journey is traveling
   together, and the ending gives everyone the same completion reward
   regardless of who answered what. */

export class RewardSystem {
  constructor(){
    this.stars = 0;
  }

  add(amount){
    this.stars += amount;
    return this.stars;
  }

  reset(){
    this.stars = 0;
  }
}
