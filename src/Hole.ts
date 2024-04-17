import { Scene } from 'phaser';
import { Bone, SpineGameObject } from '@esotericsoftware/spine-phaser';

import { Player } from '~/Player';
import { DepthGroup } from '~/enums/DepthGroup';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { CollideCallback } from '~/types/CollideCallback';
import { GameEvent } from '~/enums/GameEvent';
import { emit } from '~/utils/eventEmitterUtils';

type HoleOptions = {
  startPos: Phaser.Math.Vector2;
};
const CIRCLE_RADIUS = 7;
export class Hole {
  startPoint: Phaser.Math.Vector2;
  spineObject: SpineGameObject;
  controlBone: Bone;
  hole: MatterJS.BodyType;
  constructor(
    private scene: Scene,
    private player: Player,
    private holeOptions: HoleOptions
  ) {
    this.startPoint = holeOptions.startPos;
    this.init();
    console.log('init hole');
  }

  init() {
    this.initSpineObject();
    this.initPhysics();
    this.handleCollisions();
  }

  handleCollisions() {
    this.hole.onCollideCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (bodyA.label === BodyTypeLabel.enemy || bodyA.label === BodyTypeLabel.player) {
        // this.spineObject.skeleton.setSkinByName('dead');
        emit(GameEvent.fallInHole, { other: bodyA });
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
  handleHoleShadowOffset() {
    const holePos = new Phaser.Math.Vector2(this.spineObject.x, this.spineObject.y);
    const maxOffset = 15;
    const diffX = this.player.x - this.spineObject.x;
    const diffY = this.spineObject.y - this.player.y;

    this.controlBone.x = diffX / 20;
    this.controlBone.y = diffY / 20 - 10;
    if (this.controlBone.x < -maxOffset) this.controlBone.x = -maxOffset;
    if (this.controlBone.x > maxOffset) this.controlBone.x = maxOffset;
    if (this.controlBone.y < -maxOffset) this.controlBone.y = -maxOffset;
    if (this.controlBone.y > maxOffset) this.controlBone.y = maxOffset;
  }
}
