import { Game } from 'phaser';
import { debounce } from 'lodash';

import { GAME_HEIGHT, GAME_WIDTH, centerScene } from '~/utils/gameUtils';
import { emit } from '~/utils/eventEmitterUtils';
import { SceneKey } from '~/enums/SceneKey';
import { GameEvent } from '~/enums/GameEvent';

let game: Game = null;

function onResize() {
  scaleGame();
  game.scene.getScenes().forEach((s) => {
    // since we are following the player, we don't want to center the Level scene as we do other scenes
    if (s.scene.key === SceneKey.Level) return;
    centerScene(s);
  });
  emit(GameEvent.resize);
}

function onFullscreenchange() {
  scaleGame();
  game.scene.getScenes().forEach((s) => {
    // since we are following the player, we don't want to center the Level scene as we do other scenes
    if (s.scene.key === SceneKey.Level) return;
    centerScene(s);
  });
  emit(GameEvent.fullscreen);
}

const debounceResize = debounce(onResize, 150);
const debounceFullscreen = debounce(onFullscreenchange, 500);

// Call when game is destroyed
function removeEventListener() {
  document.removeEventListener('fullscreenchange', debounceFullscreen);
  window.removeEventListener('resize', debounceResize);
}

function listenForGameEvents() {
  document.addEventListener('fullscreenchange', debounceFullscreen);
  window.addEventListener('resize', debounceResize);
}

export function scaleGame() {
  // Scale the game as wide as it can be, and let the scenes center themslves properly.
  const gameRatio = GAME_WIDTH / GAME_HEIGHT;
  const windowRatio = window.innerWidth / window.innerHeight;
  const scaleRatio = Math.min(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth);
  if (windowRatio > gameRatio) {
    game.scale.setGameSize(
      Math.max(window.innerWidth * 2, GAME_HEIGHT * scaleRatio),
      Math.max(window.innerHeight, GAME_HEIGHT)
    );
  } else {
    game.scale.setGameSize(GAME_WIDTH, GAME_WIDTH / scaleRatio);
  }
}

export function setGame(g: Game) {
  game = g;
  scaleGame();
}

listenForGameEvents();
