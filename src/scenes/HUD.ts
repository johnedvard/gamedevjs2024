import { Battery } from '~/Battery';
import { DepthGroup } from '~/enums/DepthGroup';
import { SceneKey } from '~/enums/SceneKey';
import { GAME_WIDTH, centerScene } from '~/utils/gameUtils';

export class HUD extends Phaser.Scene {
  battery: Battery;
  constructor() {
    super(SceneKey.HUD);
  }
  create() {
    centerScene(this);
    this.battery = new Battery(this);

    const hand = this.add.spine(GAME_WIDTH - 10, 145, 'hand-skel', 'hand-atlas').setDepth(DepthGroup.ui);
    hand.animationState.setAnimation(0, 'tap', true);
  }
  preload() {}
  update(time: number, delta: number) {
    this.battery?.update(time, delta);
  }
}
