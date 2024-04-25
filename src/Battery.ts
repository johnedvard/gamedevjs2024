import { Scene } from 'phaser';
import { SpineGameObject } from '@esotericsoftware/spine-phaser';

import { GAME_WIDTH } from '~/utils/gameUtils';
import { emit, off, on } from '~/utils/eventEmitterUtils';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { playDischarge } from './utils/audioUtils';

export const MAX_CHARGES = 3;
const START_CHARGES = 1;
export class Battery {
  spineBattery: SpineGameObject;
  charges = START_CHARGES;
  constructor(private scene: Scene) {
    this.init();
  }
  init() {
    this.initSpineObject();
    this.initClickArea();
    this.listenForEvents();
  }
  onBatteryClick = () => {
    this.discharge();
  };
  onDischargePreview = () => {
    emit(GameEvent.dischargePreview);
  };
  onDischargeDismissPreview = () => {
    emit(GameEvent.dischargeDismissPreview);
  };
  initClickArea() {
    const clickableGraphics = this.scene.add.graphics();
    const clickableRect = new Phaser.Geom.Rectangle(GAME_WIDTH - 135, 60, 110, 75);
    clickableGraphics.setInteractive(clickableRect, Phaser.Geom.Rectangle.Contains);
    clickableGraphics.on('pointerup', this.onBatteryClick, this);
    // clickableGraphics.on('pointerdown', this.onDischargePreview, this);
    clickableGraphics.on('pointerover', this.onDischargePreview, this);
    clickableGraphics.on('pointerout', this.onDischargeDismissPreview, this);
    // enable to debug position
    // clickableGraphics.fillStyle(0xffffff);
    // clickableGraphics.fillRectShape(clickableRect);
  }
  initSpineObject() {
    this.spineBattery = this.scene.add
      .spine(GAME_WIDTH - 80, 100, 'battery-skel', 'battery-atlas')
      .setDepth(DepthGroup.ui);
    this.setSkinByChargeCount();
    this.spineBattery.animationState.timeScale = 0.9;
    const animationStateListeners = {
      complete: (trackEntry) => {
        if (trackEntry.animation.name === 'add-charge' || trackEntry.animation.name === 'spend-all') {
          this.spineBattery.animationState.setAnimation(0, 'idle');
          this.setSkinByChargeCount();
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
  setSkinByChargeCount() {
    if (this.charges === 3) {
      this.spineBattery.skeleton.setSkinByName('green');
      this.spineBattery.animationState.setAnimation(0, 'charged', true);
    } else if (this.charges === 2) {
      this.spineBattery.skeleton.setSkinByName('yellow');
    } else if (this.charges === 1) {
      this.spineBattery.skeleton.setSkinByName('red');
    } else if (this.charges === 0) {
      this.spineBattery.skeleton.setSkinByName('empty');
    }
  }

  fallInHole = (data: { other: MatterJS.BodyType }) => {
    if (data.other.label === BodyTypeLabel.enemy || data.other.label === BodyTypeLabel.powerPuck) {
      this.addCharge();
    }
  };
  discharge() {
    if (this.charges !== MAX_CHARGES) return;
    this.charges = 0;
    this.spineBattery.animationState.setAnimation(0, 'spend-all');
    playDischarge();
    emit(GameEvent.discharge);
    emit(GameEvent.batteryChange, { oldValue: MAX_CHARGES, newValue: this.charges });
  }
  addCharge() {
    this.charges++;
    if (this.charges >= MAX_CHARGES) this.charges = MAX_CHARGES;
    this.spineBattery.animationState.setAnimation(0, 'add-charge');
    emit(GameEvent.batteryChange, { oldValue: this.charges - 1, newValue: this.charges });
  }
  resetCharges() {
    this.charges = START_CHARGES;
    this.spineBattery.animationState.setAnimation(0, 'add-charge');
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
  reset() {
    this.resetCharges();
  }
}
