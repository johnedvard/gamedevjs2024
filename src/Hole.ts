import { Scene } from 'phaser';
import { Bone, SpineGameObject } from '@esotericsoftware/spine-phaser';

import { Player } from '~/Player';
import { DepthGroup } from '~/enums/DepthGroup';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { CollideCallback } from '~/types/CollideCallback';
import { GameEvent } from '~/enums/GameEvent';
import { emit } from '~/utils/eventEmitterUtils';
import { playRingAnimation } from '~/utils/animationUtils';
import { createText } from './utils/textUtils';

type HoleOptions = {
  startPos: Phaser.Math.Vector2;
};
const CIRCLE_RADIUS = 9;
export class Hole {
  startPoint: Phaser.Math.Vector2;
  spineObject: SpineGameObject;
  controlBone: Bone;
  hole: MatterJS.BodyType;
  pointsTxt: Phaser.GameObjects.Text;
  points = 1;

  constructor(
    private scene: Scene,
    private player: Player,
    private holeOptions: HoleOptions
  ) {
    this.startPoint = holeOptions.startPos;
    this.init();
  }

  init() {
    this.generatePointsMultiplier();
    this.initSpineObject();
    this.initPhysics();
    this.handleCollisions();
    this.initPointsText();
  }

  generatePointsMultiplier() {
    const doublePointsChance = 0.2;
    if (Math.random() < doublePointsChance) {
      this.points = 2;
    }
  }

  initPointsText() {
    if (this.points > 1) {
      this.pointsTxt = createText(this.scene, this.startPoint.x, this.startPoint.y, 40, '2x', { color: '#ffffff' });
      this.scene.tweens.add({
        targets: this.pointsTxt,
        scaleX: 0.38,
        scaleY: 0.38,
        repeat: -1,
        yoyo: true,
        y: this.startPoint.y + Math.random() * 2,
        duration: 500 + Math.random() * 100,
        ease: Phaser.Math.Easing.Sine.InOut,
      });
    }
  }

  handleCollisions() {
    this.hole.onCollideCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (bodyA.label === BodyTypeLabel.enemy || bodyA.label === BodyTypeLabel.player) {
        // this.spineObject.skeleton.setSkinByName('dead');
        if (bodyA.label === BodyTypeLabel.enemy) playRingAnimation(this.scene, this.startPoint);

        emit(GameEvent.fallInHole, { other: bodyA, hole: bodyB, points: this.points });
      }
    };
  }

  initSpineObject() {
    this.spineObject = this.scene.add
      .spine(this.startPoint.x, this.startPoint.y, 'hole-skel', 'hole-atlas')
      .setDepth(DepthGroup.hole);
    this.controlBone = this.spineObject.skeleton.findBone('outerControlBone');
  }

  initPhysics() {
    this.hole = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, CIRCLE_RADIUS, {
      label: BodyTypeLabel.hole,
      isStatic: true,
      isSensor: true,
    });
  }
  update(time: number, delta: number) {
    this.handleHoleShadowOffset();
  }
  private destroyPhysicsObjects() {
    if (!this.hole) return;
    this.scene.matter.world.remove(this.hole);
    this.hole = null;
  }

  private destroy() {
    if (!this.spineObject) return;
    this.spineObject.destroy();
    this.spineObject = null;
    if (this.pointsTxt) {
      this.pointsTxt.destroy();
      this.pointsTxt = null;
    }
  }

  destroyEverything() {
    this.destroyPhysicsObjects();
    this.destroy();
  }

  handleHoleShadowOffset() {
    if (!this.player || !this.spineObject) return;
    const maxOffsetY = 18;
    const maxOffsetX = 15;
    const diffX = this.player.x - this.spineObject.x;
    const diffY = this.spineObject.y - this.player.y;

    this.controlBone.x = diffX / 20;
    this.controlBone.y = diffY / 20 - 10;
    if (this.controlBone.x < -maxOffsetX) this.controlBone.x = -maxOffsetX;
    if (this.controlBone.x > maxOffsetX) this.controlBone.x = maxOffsetX;
    if (this.controlBone.y < -maxOffsetY) this.controlBone.y = -maxOffsetY;
    if (this.controlBone.y > maxOffsetY) this.controlBone.y = maxOffsetY;
  }
}
