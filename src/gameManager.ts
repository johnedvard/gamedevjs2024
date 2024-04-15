import { Game } from "phaser";
import { debounce } from "lodash";

import { GameEvent } from "~/enums/GameEvent";
import { GameState } from "~/types/GameState";
import { emit, off, on } from "~/utils/eventEmitterUtils";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  centerScene,
  createBackground,
} from "~/utils/gameUtils";

let state: GameState = "main-menu";
let game: Game = null;

function onPlay() {
  setGameState("active");
}

function onGameOver() {
  setGameState("game-over");
}

function onReplay() {
  setGameState("main-menu");
}

function onHome() {
  setGameState("main-menu");
}

function onResize() {
  scaleGame();
  game.scene.getScenes().forEach((s) => {
    centerScene(s);
    createBackground(s);
  });
}

function onFullscreenchange() {
  scaleGame();
  game.scene.getScenes().forEach((s) => {
    centerScene(s);
    createBackground(s);
  });
}

const debounceResize = debounce(onResize, 300);
const debounceFullscreen = debounce(onFullscreenchange, 500);

function onRemoveListeners() {
  off(GameEvent.gameOver, onGameOver);
  off(GameEvent.destroyAll, onRemoveListeners);
  off(GameEvent.replay, onReplay);
  off(GameEvent.home, onHome);
  off(GameEvent.play, onPlay);
  document.removeEventListener("fullscreenchange", debounceFullscreen);
  window.removeEventListener("resize", debounceResize);
}

function listenForGameEvents() {
  on(GameEvent.gameOver, onGameOver);
  on(GameEvent.destroyAll, onRemoveListeners);
  on(GameEvent.replay, onReplay);
  on(GameEvent.home, onHome);
  on(GameEvent.play, onPlay);
  document.addEventListener("fullscreenchange", debounceFullscreen);
  window.addEventListener("resize", debounceResize);
}

export function scaleGame() {
  // Scale the game as wide as it can be, and let the scenes center themslves properly.
  const gameRatio = GAME_WIDTH / GAME_HEIGHT;
  const windowRatio = window.innerWidth / window.innerHeight;
  const scaleRatio = Math.min(
    window.innerWidth / window.innerHeight,
    window.innerHeight / window.innerWidth,
  );
  if (windowRatio > gameRatio) {
    game.scale.setGameSize(
      Math.max(window.innerWidth * 2, GAME_HEIGHT * scaleRatio),
      Math.max(window.innerHeight, GAME_HEIGHT),
    );
  } else {
    game.scale.setGameSize(GAME_WIDTH, GAME_WIDTH / scaleRatio);
  }
}

export function getGameState(): GameState {
  return state;
}

export function setGameState(gameState: GameState): void {
  state = gameState;
  emit(GameEvent.gameStateChange, { gameState });
}

export function setGame(g: Game) {
  game = g;
  scaleGame();
}

listenForGameEvents();
