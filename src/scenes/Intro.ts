import { Input } from "phaser";
import { SceneKey } from "~/enums/SceneKey";

export class Intro extends Phaser.Scene {
  isIntroComplete = false;
  isStartMainMenu = false;

  constructor() {
    super(SceneKey.Intro);
  }

  preload(): void {}

  create(): void {
    this.startIntro();
    this.addEventListeners();
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
    this.scene.start(SceneKey.Level, { freeplay: false });
    this.input.off('pointerdown', this.onPlayButtonClick);
    
  };

  addEventListeners() {
    this.input.on('pointerdown', this.onPlayButtonClick);
  }
  removeEventListeners(){
    this.input.off('pointerdown', this.onPlayButtonClick);
  }

  update(time: number, delta: number): void {
    if (this.isStartMainMenu) {
    } else if (this.isIntroComplete) {
    }
  }

}
