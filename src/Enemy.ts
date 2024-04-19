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
  isDestroyed = false;

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
    this.spineObject.animationState.timeScale = 0.5;
  }

  initPhysics() {
    this.ball = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, BALL_RADIUS, {
      label: BodyTypeLabel.enemy,
      frictionAir: 0.03,
      friction: 0.1,
      restitution: 0.9,
    });
  }

  fallInHole = (data: { other: MatterJS.BodyType; hole: MatterJS.BodyType }) => {
    if (data.other === this.ball) {
      this.scene.add.tween({
        targets: this.spineObject,
        x: data.hole.position.x,
        y: data.hole.position.y,
        duration: 1000,
      });
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
    this.spineObject.setDepth(DepthGroup.player + this.ball.position.y);
    this.eyeGroup.rotation = Phaser.Math.RadToDeg(this.ball.angle) * -1;
  }

  private destroyPhysicsObjects() {
    this.scene.matter.world.remove(this.ball);
    this.ball = null;
  }

  private destroy() {
    this.state = 'dead';
    this.removeEventListeners();
    this.spineObject.destroy();
    this.spineObject = null;
    this.isDestroyed = true;
  }

  destroyEverything() {
    this.destroyPhysicsObjects();
    this.destroy();
  }

  get x() {
    return this.ball.position.x;
  }

  get y() {
    return this.ball.position.y;
  }
  get eyeGroup() {
    return this.spineObject.skeleton.findBone('eye-group');
  }
}
