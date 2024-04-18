import { SceneKey } from '~/enums/SceneKey';

export class Boot extends Phaser.Scene {
  preload(): void {
    this.load.setPath('assets/gamedevjs2024');
    this.loadSvgs();
    this.loadSounds();
    this.preloadSpineAnimations();
    this.loadFonts();
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
    this.load.spineBinary('battery-skel', 'assets/gamedevjs2024/spine/battery.skel');
    this.load.spineAtlas('battery-atlas', 'assets/gamedevjs2024/spine/battery.atlas');
  }

  loadUi(): void {
    // this.load.image('icon-home', 'ui/icon-home.png');
  }

  loadSvgs(): void {
    // this.load.text('svg-star', 'svg/something.svg');
  }

  loadFont(name: string, url: string) {
    var newFont = new FontFace(name, `url(${url})`);
    newFont
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
      })
      .catch((error) => {
        console.log('err', error);
        return error;
      });
  }
  
  loadFonts(){
    this.loadFont('ConcertOne', 'assets/gamedevjs2024/fonts/ConcertOne-Regular.ttf');
  }
  create(): void {
    this.scene.start(SceneKey.Intro);
  }
}
