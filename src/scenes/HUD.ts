import { SpineGameObject } from '@esotericsoftware/spine-phaser';

import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';

import { Battery } from '~/Battery';
import { Score } from '~/Score';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { SceneKey } from '~/enums/SceneKey';
import { off, on } from '~/utils/eventEmitterUtils';
import { GAME_HEIGHT, GAME_WIDTH, centerScene, startWaitRoutine } from '~/utils/gameUtils';

const RELASE_DEADZONE = 20;

export class HUD extends Phaser.Scene {
  battery: Battery;
  spineHand: SpineGameObject;
  startDragTutorialSubscription: Subscription;
  score: Score;

  constructor() {
    super(SceneKey.HUD);
  }
  preload() {}
  create() {
    centerScene(this);
    this.battery = new Battery(this);
    this.score = new Score(this);
    this.listenForEvents();
    this.initSpineHand();
    this.handleDragTutorial();
    // const g = this.add.graphics();
    // g.fillStyle(0x222222,0.2);
    // g.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT)
  }
  onBatteryChange = (data: { oldValue: number; newValue: number }) => {
    this.handleTapTutorial();
  };
  onReleaseBallThrow = ({ holdDuration, diffX, diffY }: { holdDuration: number; diffX: number; diffY: number }) => {
    if (Math.abs(diffX) < RELASE_DEADZONE && Math.abs(diffY) < RELASE_DEADZONE) return;
    this.stopDragTutorial();
  };

  initSpineHand() {
    this.spineHand = this.add.spine(0, 0, 'hand-skel', 'hand-atlas').setDepth(DepthGroup.ui);
    this.spineHand.animationState.timeScale = 0.5;
    this.spineHand.visible = false;
  }

  onReplay = () => {
    this.battery.reset();
    this.score.reset();
    this.spineHand.animationState.setAnimation(0, 'idle');
    this.spineHand.visible = false;
  };

  listenForEvents() {
    on(GameEvent.batteryChange, this.onBatteryChange);
    on(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    on(GameEvent.replay, this.onReplay);
  }
  removeEventListeners() {
    off(GameEvent.batteryChange, this.onBatteryChange);
    off(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    off(GameEvent.replay, this.onReplay);
  }

  stopDragTutorial() {
    if (!this.startDragTutorialSubscription) return;
    this.startDragTutorialSubscription.unsubscribe();
    this.spineHand.visible = false;
    this.startDragTutorialSubscription = null;
  }

  handleDragTutorial() {
    this.startDragTutorialSubscription = startWaitRoutine(this, 2000)
      .pipe(take(1))
      .subscribe(() => {
        this.spineHand.x = GAME_WIDTH / 2 + 110;
        this.spineHand.y = GAME_HEIGHT / 2 + 30;
        this.spineHand.visible = true;
        this.spineHand.animationState.setAnimation(0, 'drag', true);
      });
  }
  handleTapTutorial() {
    if (!this.battery.isCharged()) {
      this.spineHand.visible = false;
      this.spineHand.animationState?.setAnimation(0, 'idle', false);
      return;
    }
    startWaitRoutine(this, 3000)
      .pipe(take(1))
      .subscribe(() => {
        if (!this.battery.isCharged()) return;
        this.spineHand.x = GAME_WIDTH - 10;
        this.spineHand.y = 140;
        this.spineHand.visible = true;
        this.spineHand.animationState.setAnimation(0, 'tap', true);
      });
  }
}
