import { Scene } from 'phaser';

let isInitialized = false;
let musicOn = true;
let sfxOn = true;
let backgroundMusic = null;
const puckhitSounds = [];
const fallInHoleSounds = [];
const explotionSounds = [];
const dischargeSounds = [];
const playerDieSounds = [];
const uiClickSounds = [];
const bgVolume = 0.13;

export function isMusicAndSfxInitialized() {
  return isInitialized;
}

export function destroyMusicAndSfx() {
  musicOn = true;
  sfxOn = true;
  backgroundMusic = null;
  isInitialized = false;
}
export function initMusicAndSfx(scene: Scene) {
  if (isInitialized) return;
  const backgroundMusicId = `bgm`;

  backgroundMusic = scene.sound.add(backgroundMusicId, { loop: true, volume: bgVolume }) as Phaser.Sound.WebAudioSound;
  puckhitSounds.push(scene.sound.add('click1'));
  puckhitSounds.push(scene.sound.add('click2'));
  puckhitSounds.push(scene.sound.add('click3'));
  puckhitSounds.push(scene.sound.add('click4'));
  puckhitSounds.push(scene.sound.add('click5'));

  fallInHoleSounds.push(scene.sound.add('fallinhole1'));
  fallInHoleSounds.push(scene.sound.add('fallinhole2'));
  fallInHoleSounds.push(scene.sound.add('fallinhole3'));

  explotionSounds.push(scene.sound.add('explotion1'));

  playerDieSounds.push(scene.sound.add('player-die1'));

  uiClickSounds.push(scene.sound.add('ui-click1'));

  dischargeSounds.push(scene.sound.add('discharge1'));

  isInitialized = true;
}

export function playPuckHit(volume = 1) {
  if (!sfxOn) return;
  if (volume > 1) volume = 1;
  if (volume < 0) volume = 0;
  const soundIndex = Math.floor(Math.random() * puckhitSounds.length);
  puckhitSounds[soundIndex]?.play({ volume });
}

export function playFallInHole() {
  if (!sfxOn) return;
  const soundIndex = Math.floor(Math.random() * fallInHoleSounds.length);
  fallInHoleSounds[soundIndex]?.play();
}

export function playPlayerDie() {
  if (!sfxOn) return;
  const soundIndex = Math.floor(Math.random() * playerDieSounds.length);
  playerDieSounds[soundIndex]?.play();
}

export function playDischarge() {
  if (!sfxOn) return;
  const soundIndex = Math.floor(Math.random() * dischargeSounds.length);
  dischargeSounds[soundIndex]?.play();
}

export function playUiClick() {
  if (!sfxOn) return;
  const soundIndex = Math.floor(Math.random() * uiClickSounds.length);
  uiClickSounds[soundIndex]?.play();
}

export function playExplotion() {
  if (!sfxOn) return;
  const soundIndex = Math.floor(Math.random() * explotionSounds.length);
  explotionSounds[soundIndex]?.play({ volume: 0.5 });
}

export function playMusic() {
  backgroundMusic?.play();
  if (!musicOn) backgroundMusic?.pause();
}
