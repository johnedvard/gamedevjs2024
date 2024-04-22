import { SceneKey } from '~/enums/SceneKey';
import { initMusicAndSfx } from '~/utils/audioUtils';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super(SceneKey.MainMenu);
  }
  preload(): void {}
  create(): void {}
  update(): void {}
}
