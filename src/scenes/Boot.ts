import { SceneKey } from '~/enums/SceneKey';

export class Boot extends Phaser.Scene {
  preload(): void {
    this.load.setPath('assets/gamedevjs2024');
    this.loadSvgs();
    this.loadSounds();
    this.preloadSpineAnimations();
  }

  loadSounds() {
    // this.load.audio('bgm', 'sounds/bgm.mp3');
  }

  preloadSpineAnimations() {
    // Need to set path to "" to be able to load the packed images correctly
    this.load.setPath('');
    this.load.spineBinary('enemy-skel', 'assets/gamedevjs2024/spine/enemy.skel');
    this.load.spineAtlas('enemy-atlas', 'assets/gamedevjs2024/spine/enemy.atlas');
    this.load.spineBinary('hole-skel', 'assets/gamedevjs2024/spine/hole.skel');
    this.load.spineAtlas('hole-atlas', 'assets/gamedevjs2024/spine/hole.atlas');
  }

  loadUi(): void {
    // this.load.image('icon-home', 'ui/icon-home.png');
  }

  loadSvgs(): void {
    // this.load.text('svg-star', 'svg/something.svg');
  }

  create(): void {
    this.scene.start(SceneKey.Intro);
  }
}
