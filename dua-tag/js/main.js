import { GameManager } from './gameManager.js';

const game = new GameManager();
game.init();

window.__duaTagGame = game; // exposed for manual testing/debugging in the browser console
