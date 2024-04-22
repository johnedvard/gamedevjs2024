import { Scene } from 'phaser';

let isInitialized = false;
const sfxOn = true;
const puckhitSounds = [];

export function destroyMusicAndSfx() {}
export function initMusicAndSfx(scene: Scene) {
  if (isInitialized) return;
  // const backgroundMusicId = `backgroundMusic2`;

  // backgroundMusic = scene.sound.add(backgroundMusicId, { loop: true, volume: bgVolume }) as Phaser.Sound.WebAudioSound;
  puckhitSounds.push(scene.sound.add('puckhit1'));
  isInitialized = true;
}

export function playPuckHit() {
  if (!sfxOn) return;
  // const soundIndex = Math.floor(Math.random() * puckhitSounds.length);
  // puckhitSounds[soundIndex]?.play();
}
