import { Input } from "phaser";
import { SceneKey } from "~/enums/SceneKey";

export class Intro extends Phaser.Scene {
  isIntroComplete = false;
  isStartMainMenu = false;

  constructor() {
    super(SceneKey.Intro);
  }

  async startIntro(): Promise<void> {
    this.isIntroComplete = true;
  }

  async startMainMenu() {
    this.isStartMainMenu = true;
    setTimeout(() => {
      this.scene.start(SceneKey.MainMenu);
    }, 300);
  }

  listenForInput() {
    this.input.gamepad.on(
      "down",
      (_pad: Input.Gamepad.Gamepad, button: Input.Gamepad.Button) => {
        if (this.isStartMainMenu) return;
        this.startMainMenu();
      },
    );
    this.input.keyboard.on("keydown", (evt: KeyboardEvent) => {
      if (this.isStartMainMenu) return;
      this.startMainMenu();
    });
  }

  preload(): void {}

  create(): void {
    this.startIntro();
    this.listenForInput();
  }

  update(time: number, delta: number): void {
    if (this.isStartMainMenu) {
    } else if (this.isIntroComplete) {
    }
  }
}
