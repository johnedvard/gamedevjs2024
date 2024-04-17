import { Scene } from 'phaser';
import { SpineGameObject, TrackEntry } from '@esotericsoftware/spine-phaser';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { CollideCallback } from '~/types/CollideCallback';

type EnemyOptions = { startPos: Phaser.Math.Vector2; skin?: string };
const BALL_RADIUS = 23;
export class Enemy {
  spineObject: SpineGameObject;
  ball: MatterJS.BodyType;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);

  constructor(
    private scene: Scene,
    enemyOptions: EnemyOptions
  ) {
    this.startPoint = enemyOptions.startPos;
    this.init();
  }
  init() {
    this.initSpineObject();
    this.initPhysics();
    this.listenForEvents();
    this.handleCollisions();
  }

  handleCollisions() {
    this.ball.onCollideCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (bodyA.label === BodyTypeLabel.player) {
        // this.spineObject.skeleton.setSkinByName('dead');
        this.spineObject.animationState.setAnimation(0, 'hit', false);
      }
    };
  }

  initSpineObject() {
    this.spineObject = this.scene.add
      .spine(this.startPoint.x, this.startPoint.y, 'enemy-skel', 'enemy-atlas')
      .setDepth(DepthGroup.player);
    this.spineObject.skeleton.setSkinByName('regular');
  }

  initPhysics() {
    this.ball = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, BALL_RADIUS, {
      label: BodyTypeLabel.enemy,
      frictionAir: 0.03,
      friction: 0.1,
      restitution: 0.9,
    });
  }

  listenForEvents() {}

  update(time: number, delta: number) {
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    this.spineObject.setRotation(this.ball.angle);
  }

  get x() {
    return this.ball.position.x;
  }

  get y() {
    return this.ball.position.y;
  }
}
