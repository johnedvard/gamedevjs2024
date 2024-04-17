import { Scene } from 'phaser';
import { SpineGameObject } from '@esotericsoftware/spine-phaser';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { CollideCallback } from '~/types/CollideCallback';
import { off, on } from '~/utils/eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';

type EnemyOptions = { startPos: Phaser.Math.Vector2; skin?: string };
const BALL_RADIUS = 23;
export class Enemy {
  spineObject: SpineGameObject;
  ball: MatterJS.BodyType;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
  state: '' | 'dead' = '';

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

  fallInHole = (data: { other: MatterJS.BodyType }) => {
    if (data.other === this.ball) {
      this.spineObject.skeleton.setSkinByName('dead');
      this.spineObject.animationState.setAnimation(0, 'dead', false);
      this.state = 'dead';
      this.destroyPhysicsObjects();
      const animationStateListeners = {
        complete: (trackEntry) => {
          // Animation has completed
          console.log(`Animation ${trackEntry.animation.name} has completed`);
          this.spineObject.animationState.removeListener(animationStateListeners);
          this.destroy();
          // Perform any actions you need after the animation ends here
          // For example, switching back to an idle animation or triggering game logic
        },
      };

      this.spineObject.animationState.addListener(animationStateListeners);
    }
  };
  listenForEvents() {
    on(GameEvent.fallInHole, this.fallInHole);
  }
  removeEventListeners() {
    off(GameEvent.fallInHole, this.fallInHole);
  }

  update(time: number, delta: number) {
    if (this.state === 'dead') return;
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    this.spineObject.setRotation(this.ball.angle);
  }

  destroyPhysicsObjects() {
    this.scene.matter.world.remove(this.ball);
    this.ball = null;
  }
  destroy() {
    this.state = 'dead';
    this.removeEventListeners();
    this.spineObject.destroy();
    this.spineObject = null;
  }

  get x() {
    return this.ball.position.x;
  }

  get y() {
    return this.ball.position.y;
  }
}
