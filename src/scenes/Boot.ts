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
    // this.load.spineBinary('player-data', 'spine/chibi-stickers.skel');
    // this.load.spineAtlas('player-atlas', 'spine/chibi-stickers.atlas', true);
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
