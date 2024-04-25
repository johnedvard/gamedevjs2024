import { Scene } from 'phaser';

import { DepthGroup } from '~/enums/DepthGroup';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { GameEvent } from '~/enums/GameEvent';
import { emit, off, on } from '~/utils/eventEmitterUtils';
import { startDischargeAnimation } from '~/utils/dischargeUtil';
import { Player } from '~/Player';

const DISCARGE_CIRCLE_RADIUS = 270;

export class Discharge {
  dischargeCircle: MatterJS.BodyType; // follows player (maybe move it into own class or inside player)
  dischargeBoundryGeom: Phaser.Geom.Circle; // follows player (maybe move it into own class or inside player)
  dischargeBoundryGraphics: Phaser.GameObjects.Graphics; // follows player (maybe move it into own class or inside player)
  displayDischargePreview = false;
  isDestroyed = false;
  player: Player;

  constructor(private scene: Scene) {
    this.init();
  }

  init() {
    this.dischargeCircle = this.scene.matter.add.circle(0, 0, DISCARGE_CIRCLE_RADIUS, {
      isSensor: true,
      label: BodyTypeLabel.dischargeCircle,
    });
    this.dischargeBoundryGeom = new Phaser.Geom.Circle(0, 0, DISCARGE_CIRCLE_RADIUS);
    this.dischargeBoundryGraphics = this.scene.add.graphics().setDepth(DepthGroup.particleFront);
    this.listenForEvents();
  }

  onBatteryDischarged = () => {
    // create power field around player in a radius r,
    // wipe out enemies inside the area
    this.displayDischargePreview = false;
    startDischargeAnimation(this.scene, this.player, this.dischargeBoundryGeom);
  };

  onDischargePreview = () => {
    this.displayDischargePreview = true;
  };

  onDischargeDismissPreview = () => {
    this.displayDischargePreview = false;
  };

  listenForEvents() {
    on(GameEvent.discharge, this.onBatteryDischarged);
    on(GameEvent.dischargePreview, this.onDischargePreview);
    on(GameEvent.dischargeDismissPreview, this.onDischargeDismissPreview);
  }

  removeEventListeners() {
    off(GameEvent.discharge, this.onBatteryDischarged);
    off(GameEvent.dischargePreview, this.onDischargePreview);
    off(GameEvent.dischargeDismissPreview, this.onDischargeDismissPreview);
  }
  update(time: number, delta: number) {
    if (!this.player || this.isDestroyed) return;
    if (this.dischargeCircle) {
      this.scene.matter.body.setPosition(
        this.dischargeCircle,
        new Phaser.Math.Vector2(this.player.x, this.player.y),
        false
      );
    }
    this.dischargeBoundryGraphics.clear();
    if (this.dischargeBoundryGraphics && this.displayDischargePreview) {
      this.dischargeBoundryGraphics.lineStyle(3, 0xfefefe, 0.5);
      this.dischargeBoundryGraphics.fillStyle(0xfefefe, 0.05);
      this.dischargeBoundryGraphics.x = this.player.x;
      this.dischargeBoundryGraphics.y = this.player.y;
      this.dischargeBoundryGraphics.fillCircleShape(this.dischargeBoundryGeom);
      this.dischargeBoundryGraphics.strokeCircleShape(this.dischargeBoundryGeom);
    }
  }
  setPlayer(player: Player) {
    this.player = player;
  }
  destroy() {
    this.isDestroyed = true;
    this.removeEventListeners();
    this.scene.matter.world.remove(this.dischargeCircle);
    this.dischargeBoundryGeom = null;
    this.dischargeBoundryGraphics.destroy();
    this.dischargeBoundryGraphics = null;
  }
}
