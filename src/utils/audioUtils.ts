import { Scene } from 'phaser';

let isInitialized = false;
let musicOn = true;
let sfxOn = true;
let backgroundMusic = null;
const puckhitSounds = [];
const bgVolume = 0.1;

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
  isInitialized = true;
}

export function playPuckHit(volume = 1) {
  if (!sfxOn) return;
  if (volume > 1) volume = 1;
  if (volume < 0) volume = 0;
  const soundIndex = Math.floor(Math.random() * puckhitSounds.length);
  puckhitSounds[soundIndex]?.play({volume});
}

export function playMusic() {
  backgroundMusic?.play();
  if (!musicOn) backgroundMusic?.pause();
}
