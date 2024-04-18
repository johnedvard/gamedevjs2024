import { Scene } from 'phaser';
import { SpineGameObject } from '@esotericsoftware/spine-phaser';

import { GAME_WIDTH } from '~/utils/gameUtils';
import { emit, off, on } from '~/utils/eventEmitterUtils';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { BodyTypeLabel } from './enums/BodyTypeLabel';

const MAX_CHARGES = 3;
export class Battery {
  spineBattery: SpineGameObject;
  charges = 2;
  constructor(private scene: Scene) {
    this.init();
  }
  init() {
    this.initSpineObject();
    this.listenForEvents();
  }
  initSpineObject() {
    this.spineBattery = this.scene.add
      .spine(GAME_WIDTH - 80, 100, 'battery-skel', 'battery-atlas')
      .setDepth(DepthGroup.ui);
    this.spineBattery.skeleton.setSkinByName('yellow');
    const animationStateListeners = {
      complete: (trackEntry) => {
        if (trackEntry.animation.name === 'add-charge') {
          this.spineBattery.animationState.setAnimation(0, 'idle');
          if (this.charges === 3) {
            this.spineBattery.skeleton.setSkinByName('green');

            this.spineBattery.animationState.setAnimation(0, 'charged', true);
          } else if (this.charges === 2) {
            this.spineBattery.skeleton.setSkinByName('yellow');
          } else if (this.charges === 1) {
            this.spineBattery.skeleton.setSkinByName('red');
          }
        }
        if (trackEntry.animation.name === 'charged') {
          if (this.charges < 3) {
            this.spineBattery.animationState.setAnimation(0, 'idle');
          }
        }
      },
    };

    this.spineBattery.animationState.addListener(animationStateListeners);
  }
  fallInHole = (data: { other: MatterJS.BodyType }) => {
    if (data.other.label === BodyTypeLabel.enemy) {
      this.addCharge();
    }
  };
  addCharge() {
    this.charges++;
    if (this.charges >= MAX_CHARGES) this.charges = MAX_CHARGES;
    this.spineBattery.animationState.setAnimation(0, 'add-charge');
    emit(GameEvent.batteryChange, { oldValue: this.charges - 1, newValue: this.charges });
  }
  isCharged() {
    return this.charges === MAX_CHARGES;
  }
  listenForEvents() {
    on(GameEvent.fallInHole, this.fallInHole);
  }
  removeEventListeners() {
    off(GameEvent.fallInHole, this.fallInHole);
  }
  update(time: number, delta: number) {}
}
