import { SceneKey } from "~/enums/SceneKey";
import { Player } from "./Player";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super(SceneKey.MainMenu);
  }
  preload(): void {}
  create(): void {
    new Player(this);
  }
  update(): void {}
}
