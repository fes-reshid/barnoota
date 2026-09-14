import { GameManager } from './gameManager.js';
import { LEVELS } from './levelManager.js';

const game = new GameManager();
game.init();

window.__raceGame = game; // exposed for manual testing/debugging in the browser console
window.__levels = LEVELS;
