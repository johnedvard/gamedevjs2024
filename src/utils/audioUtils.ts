import { Scene } from 'phaser';

let isInitialized = false;
let musicOn = true;
let sfxOn = true;
let backgroundMusic = null;
const puckhitSounds = [];
const bgVolume = 0.4;

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
  puckhitSounds.push(scene.sound.add('puckhit1'));
  isInitialized = true;
}

export function playPuckHit() {
  if (!sfxOn) return;
  // const soundIndex = Math.floor(Math.random() * puckhitSounds.length);
  // puckhitSounds[soundIndex]?.play();
}

export function playMusic () {
  backgroundMusic?.play();
  if (!musicOn) backgroundMusic?.pause();
};