import { Scene } from 'phaser';
import { Attachment, SpineGameObject } from '@esotericsoftware/spine-phaser';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { CollideCallback } from '~/types/CollideCallback';
import { emit, off, on } from '~/utils/eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';
import { playExplotion, playFallInHole, playPuckHit } from '~/utils/audioUtils';
import { createBallByType, createPuckByType, getSkinByType } from '~/utils/puckUtils';
import { playExplotionAnimation } from '~/utils/animationUtils';

type PuckType = 'enemy' | 'powerpuck';
type PuckOptions = { startPos: Phaser.Math.Vector2; puckType: PuckType };

const BALL_RADIUS = 23;
const POWER_FIELD_RADIUS = 100;

export class Puck {
  spineObject: SpineGameObject;
  ball: MatterJS.BodyType;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
  state: '' | 'dead' | 'exploding' = '';
  isDestroyed = false;
  highlightAttachment: Attachment;
  displayHighlight = false;
  isInisideDischargeArea = false;
  puckType: PuckType;

  // Only for power pucks
  // TODO (johnedvard) consider making sub-classes (or similar) to handle puck specific logic
  powerField: MatterJS.BodyType;
  pucksInsidePowerField: MatterJS.BodyType[] = [];

  constructor(
    private scene: Scene,
    puckOptions: PuckOptions
  ) {
    this.startPoint = puckOptions.startPos;
    this.puckType = puckOptions.puckType;
    this.init();
  }
  init() {
    this.state = '';
    this.initSpineObject();
    this.initPhysics();
    this.listenForEvents();
    this.handleCollisions();
    this.handlePowerFieldCollision();
  }

  handlePuckHit(impactSpeed = 0) {
    if (this.state === 'dead') return;
    const maxSpeedToConsider = 25;
    playPuckHit(Math.min(impactSpeed, maxSpeedToConsider) / maxSpeedToConsider);
    if (this.state === 'exploding') return;
    this.spineObject.animationState.setAnimation(0, 'hit', false);
    if (this.puckType === 'powerpuck') {
      this.state = 'exploding';
      // TODO get pucks in proximity, and apply force to each of them
      this.spineObject.animationState.timeScale = 2;
      this.spineObject.animationState.setAnimation(0, 'explode', false);
      playExplotion();
      const animationStateListeners = {
        event: (entry, event) => {
          if (this.state === 'dead') return;
          if (entry.animation.name === 'explode' && event.data.name === 'playExplodeRing') {
            playExplotionAnimation(
              this.scene,
              new Phaser.Math.Vector2(this.powerField.position.x, this.powerField.position.y)
            );
          }
        },
        complete: (trackEntry) => {
          if (trackEntry.animation.name === 'explode') {
            if (this.state === 'dead') return;
            this.spineObject.animationState.timeScale = 0.5;
            this.spineObject.animationState.removeListener(animationStateListeners);
            const force = new Phaser.Math.Vector2(1, 1).scale(0.1);
            this.pucksInsidePowerField.forEach((p) => {
              const angle = Phaser.Math.Angle.BetweenPoints(this.powerField.position, p.position);
              const distance = Phaser.Math.Distance.BetweenPoints(this.powerField.position, p.position);
              const force = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(6 / distance);
              this.scene.matter.applyForce(p, force);
            });
            this.startDieRoutine('dead', 0);
          }
        },
      };
      this.spineObject.animationState.addListener(animationStateListeners);
    }
  }

  handleCollisions() {
    this.ball.onCollideCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (
        (bodyA === this.ball &&
          (bodyB.label === BodyTypeLabel.player ||
            bodyB.label === BodyTypeLabel.enemy ||
            bodyB.label === BodyTypeLabel.powerPuck)) ||
        (bodyB === this.ball &&
          (bodyA.label === BodyTypeLabel.player ||
            bodyA.label === BodyTypeLabel.enemy ||
            bodyA.label === BodyTypeLabel.powerPuck))
      ) {
        const puckWithMaxSpeed = Math.max(bodyA.speed, bodyB.speed);
        this.handlePuckHit(puckWithMaxSpeed);
      }
      if (bodyA.label === BodyTypeLabel.dischargeCircle || bodyB.label === BodyTypeLabel.dischargeCircle) {
        this.isInisideDischargeArea = true;
      }
    };
    this.ball.onCollideEndCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (bodyA.label === BodyTypeLabel.dischargeCircle || bodyB.label === BodyTypeLabel.dischargeCircle) {
        this.isInisideDischargeArea = false;
      }
    };
  }

  handlePowerFieldCollision() {
    if (!this.powerField) return;
    this.powerField.onCollideCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (
        bodyA === this.powerField &&
        (bodyB.label === BodyTypeLabel.player ||
          bodyB.label === BodyTypeLabel.enemy ||
          bodyB.label === BodyTypeLabel.powerPuck)
      ) {
        this.pucksInsidePowerField.push(bodyB);
      } else if (
        bodyB === this.powerField &&
        (bodyA.label === BodyTypeLabel.player ||
          bodyA.label === BodyTypeLabel.enemy ||
          bodyA.label === BodyTypeLabel.powerPuck)
      ) {
        this.pucksInsidePowerField.push(bodyA);
      }
    };
    this.powerField.onCollideEndCallback = ({ bodyA, bodyB }: CollideCallback) => {
      if (
        (bodyA === this.powerField &&
          (bodyB.label === BodyTypeLabel.player ||
            bodyB.label === BodyTypeLabel.enemy ||
            bodyB.label === BodyTypeLabel.powerPuck)) ||
        (bodyB === this.powerField &&
          (bodyA.label === BodyTypeLabel.player ||
            bodyA.label === BodyTypeLabel.enemy ||
            bodyA.label === BodyTypeLabel.powerPuck))
      ) {
        for (let i = this.pucksInsidePowerField.length - 1; i >= 0; i--) {
          const puck = this.pucksInsidePowerField[i];
          if (puck.id === bodyB.id || puck.id === bodyA.id) {
            this.pucksInsidePowerField.splice(i, 1);
          }
        }
      }
    };
  }

  initSpineObject() {
    this.spineObject = createPuckByType(this.scene, this.startPoint, this.puckType);
    this.highlightAttachment = this.spineObject.skeleton.getAttachmentByName('player/highlight', 'player/highlight');
  }

  initPhysics() {
    this.ball = createBallByType(this.scene, this.startPoint, BALL_RADIUS, this.puckType);
    if (this.puckType === 'powerpuck') {
      this.powerField = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, POWER_FIELD_RADIUS, {
        label: BodyTypeLabel.powerField,
        isSensor: true,
      });
    }
  }

  fallInHole = (data: { other: MatterJS.BodyType; hole: MatterJS.BodyType; points: number }) => {
    if (data.other === this.ball) {
      this.scene.add.tween({
        targets: this.spineObject,
        x: data.hole.position.x,
        y: data.hole.position.y,
        duration: 1000,
      });
      playFallInHole();
      this.startDieRoutine('default', data.points);
    }
  };

  startDieRoutine(skin: 'default' | 'dead', points: number) {
    if (skin === 'default') {
      this.spineObject.skeleton.setSkinByName(getSkinByType(this.puckType));
    } else {
      this.spineObject.skeleton.setSkinByName(skin);
    }
    this.spineObject.animationState.setAnimation(0, 'dead', false);
    this.state = 'dead';
    this.destroyPhysicsObjects();
    emit(GameEvent.puckKilled, { puck: this, points });
    const animationStateListeners = {
      complete: (trackEntry) => {
        this.spineObject.animationState.removeListener(animationStateListeners);
        this.destroy();
      },
    };

    this.spineObject.animationState.addListener(animationStateListeners);
  }

  onDischargeComplete = () => {
    if (this.isInisideDischargeArea) this.startDieRoutine('dead', 1);
  };
  onDischargePreview = () => {
    if (this.isInisideDischargeArea) this.showHighlight();
  };
  onDischargeDismissPreview = () => {
    this.hideHighlight();
  };

  listenForEvents() {
    on(GameEvent.fallInHole, this.fallInHole);
    on(GameEvent.dischargePreview, this.onDischargePreview);
    on(GameEvent.dischargeDismissPreview, this.onDischargeDismissPreview);
    on(GameEvent.dischargeComplete, this.onDischargeComplete);
  }
  removeEventListeners() {
    off(GameEvent.fallInHole, this.fallInHole);
    off(GameEvent.dischargePreview, this.onDischargePreview);
    off(GameEvent.dischargeDismissPreview, this.onDischargeDismissPreview);
    off(GameEvent.dischargeComplete, this.onDischargeComplete);
  }

  update(time: number, delta: number) {
    if (this.state === 'dead') return;
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    this.spineObject.setDepth(DepthGroup.player + 1 / Math.abs(this.ball.position.y - 3000));
    this.eyeGroup.rotation = Phaser.Math.RadToDeg(this.ball.angle) * -1;

    if (this.powerField) {
      this.scene.matter.body.setPosition(
        this.powerField,
        new Phaser.Math.Vector2(this.ball.position.x, this.ball.position.y),
        false
      );
    }
  }

  private destroyPhysicsObjects() {
    if (!this.ball) return;
    this.scene.matter.world.remove(this.ball);
    this.ball = null;
    if (this.powerField) {
      this.scene.matter.world.remove(this.powerField);
      this.powerField = null;
    }
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

  showHighlight() {
    this.spineObject.skeleton.findSlot('player/highlight').setAttachment(this.highlightAttachment);
  }
  hideHighlight() {
    this.spineObject.skeleton.findSlot('player/highlight').setAttachment(null);
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
