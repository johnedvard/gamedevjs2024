import { Battery } from '~/Battery';
import { SceneKey } from '~/enums/SceneKey';
import { centerScene } from '~/utils/gameUtils';

export class HUD extends Phaser.Scene {
  battery: Battery;
  constructor() {
    super(SceneKey.HUD);
  }
  create() {
    centerScene(this);
    this.battery = new Battery(this);
  }
  preload() {}
  update(time: number, delta: number) {
    this.battery?.update(time, delta);
  }
}
