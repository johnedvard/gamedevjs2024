import { SpineGameObject } from '@esotericsoftware/spine-phaser';
import { DepthGroup } from '~/enums/DepthGroup';
import { SceneKey } from '~/enums/SceneKey';
import { initMusicAndSfx, isMusicAndSfxInitialized, playMusic, playUiClick } from '~/utils/audioUtils';
import { GAME_HEIGHT, GAME_WIDTH, centerScene } from '~/utils/gameUtils';
import { createText } from '~/utils/textUtils';

export class Intro extends Phaser.Scene {
  isIntroComplete = false;
  isStartMainMenu = false;
  spineObject: SpineGameObject;
  constructor() {
    super(SceneKey.Intro);
  }

  preload(): void {
    if (isMusicAndSfxInitialized()) return;
    initMusicAndSfx(this);
    playMusic();
  }

  create(): void {
    centerScene(this);
    this.initSpineObject();
    this.startIntro();
    initMusicAndSfx(this);
  }

  initText() {
    const clickToStartTxt = createText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 120, 'Click to\nstart', {
      align: 'center',
    });
    this.tweens.add({
      targets: clickToStartTxt,
      y: GAME_HEIGHT / 2 + 30,
      duration: 2400,
      repeat: -1,
      yoyo: true,
      ease: Phaser.Math.Easing.Quadratic.InOut,
    });
  }

  initSpineObject() {
    this.spineObject = this.add
      .spine(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'title-skel', 'title-atlas')
      .setDepth(DepthGroup.ui);
    this.spineObject.animationState.setAnimation(0, 'in', false);
    const animationStateListeners = {
      complete: (trackEntry) => {
        if (trackEntry.animation.name === 'in') {
          this.initText();
          this.addEventListeners();
          this.spineObject.animationState.setAnimation(0, 'idle', true);
          this.tweens.add({
            targets: this.spineObject,
            y: GAME_HEIGHT / 3 + 30,
            repeat: -1,
            duration: 2500,
            yoyo: true,
            ease: Phaser.Math.Easing.Quadratic.InOut,
          });
        }
        this.spineObject.animationState.removeListener(animationStateListeners);
      },
    };

    this.spineObject.animationState.addListener(animationStateListeners);
    this.spineObject.animationState.timeScale = 0.5;
  }

  async startIntro(): Promise<void> {
    this.isIntroComplete = true;
  }

  async startMainMenu() {
    this.isStartMainMenu = true;
    setTimeout(() => {
      this.removeEventListeners();
      this.scene.start(SceneKey.MainMenu);
    }, 300);
  }

  onPlayButtonClick = () => {
    playUiClick();
    this.scene.start(SceneKey.Level, { freeplay: false });
    this.input.off('pointerdown', this.onPlayButtonClick);
  };

  addEventListeners() {
    this.input.on('pointerdown', this.onPlayButtonClick);
  }
  removeEventListeners() {
    this.input.off('pointerdown', this.onPlayButtonClick);
  }

  update(time: number, delta: number): void {
    if (this.isStartMainMenu) {
    } else if (this.isIntroComplete) {
    }
  }
}
