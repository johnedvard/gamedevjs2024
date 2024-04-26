import { Scene } from 'phaser';
import { Bone, SpineGameObject } from '@esotericsoftware/spine-phaser';

import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { emit, off, on } from '~/utils/eventEmitterUtils';
import { createText } from '~/utils/textUtils';
import { startWaitRoutine } from '~/utils/gameUtils';
import { MAX_CHARGES } from './Battery';
import { playPlayerDie } from './utils/audioUtils';

type PlayerOptions = { startPos: Phaser.Math.Vector2 };
type TrailParticle = { pos: Phaser.Math.Vector2; timeToLive: number; maxLifeTime: number };
const BALL_RADIUS = 23;
const MAX_SHOTS = 5;
const TEXT_OFFSET = new Phaser.Math.Vector2(2, 70);
const RELASE_DEADZONE = 40;
const VELOCITY_DEADZONE = 2;
const MAX_FORCE_DIFF = 300;

export class Player {
  spineObject: SpineGameObject;
  hole: SpineGameObject;
  ball: MatterJS.BodyType;
  trailRope: Phaser.GameObjects.Rope;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
  deadPos: Phaser.Math.Vector2; // store the position we died
  controlBone: Bone;
  waitBeforeDieSubscription: Subscription;
  state: '' | 'dead' = '';
  shots = MAX_SHOTS;
  trailParticles: TrailParticle[] = [];

  handleShotsTxtTween: Phaser.Tweens.Tween;
  shotsTxt: Phaser.GameObjects.Text;
  shotsTxtContainer: Phaser.GameObjects.Container;

  constructor(
    private scene: Scene,
    playerOptions: PlayerOptions
  ) {
    this.startPoint = playerOptions.startPos;
    console.log('startPos', playerOptions.startPos);
    this.init();
  }
  init() {
    this.initSpineObject();
    this.initPhysics();
    this.listenForEvents();
    this.initShotsTxt();
    this.initTrail();
  }

  initTrail() {
    this.trailRope = this.scene.add.rope(0, 0, 'trailTexture');
    this.trailRope.setPoints(150);
    this.trailRope.setColors(0x115424);
    this.trailRope.setDepth(DepthGroup.player - 1);
  }

  initShotsTxt() {
    // TODO (johnedvard) move to a new class
    this.shotsTxt = createText(this.scene, 0, 0, 50, this.getShotsText(), { align: 'center' });
    this.shotsTxtContainer = this.scene.add
      .container(this.x + TEXT_OFFSET.x, this.y + TEXT_OFFSET.y, this.shotsTxt)
      .setDepth(DepthGroup.ui);
  }

  initSpineObject() {
    this.spineObject = this.scene.add
      .spine(this.startPoint.x, this.startPoint.y, 'enemy-skel', 'enemy-atlas')
      .setDepth(DepthGroup.player);
    this.spineObject.skeleton.setSkinByName('player');
    this.spineObject.animationState.timeScale = 0.5;
    this.scene.cameras.main.startFollow(this.spineObject, true, 0, 0.2);
  }

  initPhysics() {
    this.ball = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, BALL_RADIUS, {
      label: BodyTypeLabel.player,
      frictionAir: 0.028,
      friction: 0.1,
      restitution: 0.7,
    });
  }

  onStartBallThrow = () => {
    if (this.state === 'dead') return;
    this.handleShotsTxtTween?.stop();
    this.shotsTxt.alpha = 1;
  };

  onReleaseBallThrow = ({ holdDuration, diffX, diffY }: { holdDuration: number; diffX: number; diffY: number }) => {
    if (this.state === 'dead') return;
    this.handleShotsTxtTween?.stop();
    this.handleShotsTxtTween = this.scene.tweens.add({
      targets: this.shotsTxt,
      duration: 2000,
      alpha: 0,
      delay: 2000,
      ease: Phaser.Math.Easing.Quadratic.InOut,
    });

    if (Math.abs(diffX) < RELASE_DEADZONE && Math.abs(diffY) < RELASE_DEADZONE) return;
    if (this.shots <= 0) return;
    if (Math.abs(diffX) > MAX_FORCE_DIFF) diffX = MAX_FORCE_DIFF * Math.sign(diffX);
    if (Math.abs(diffY) > MAX_FORCE_DIFF) diffY = MAX_FORCE_DIFF * Math.sign(diffY);
    const force = new Phaser.Math.Vector2(
      Math.min(1, diffX / -MAX_FORCE_DIFF),
      Math.max(-1, diffY / -MAX_FORCE_DIFF)
    ).scale(0.18);
    this.scene.matter.applyForce(this.ball, force);
    this.addShots(-1);
    // this.spineObject.setScale(1,1);
  };

  fallInHole = (data: { other: MatterJS.BodyType; hole: MatterJS.BodyType; points: number }) => {
    if (data.other === this.ball) {
      this.scene.add.tween({
        targets: this.spineObject,
        x: data.hole.position.x,
        y: data.hole.position.y,
        duration: 1000,
      });
      this.startDieRoutine();
    } else if (data.other.label === BodyTypeLabel.enemy) {
      this.addShots(data.points);
    }
  };

  batteryChange = ({ newValue, oldValue }) => {
    if (this.state === 'dead') return;
    if (newValue === MAX_CHARGES) {
      this.spineObject.animationState.setAnimation(0, 'charged', true);
    } else {
      this.spineObject.animationState.setAnimation(0, 'idle');
    }
  };

  listenForEvents() {
    on(GameEvent.startBallThrow, this.onStartBallThrow);
    on(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    on(GameEvent.fallInHole, this.fallInHole);
    on(GameEvent.batteryChange, this.batteryChange);
  }

  removeEventListeners() {
    off(GameEvent.startBallThrow, this.onStartBallThrow);
    off(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    off(GameEvent.fallInHole, this.fallInHole);
    off(GameEvent.batteryChange, this.batteryChange);
  }

  update(time: number, delta: number) {
    this.handleTrail(time, delta); // make trail animate even when we're dead
    if (this.state === 'dead') return;
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    this.spineObject.setDepth(DepthGroup.player + 1 / Math.abs(this.ball.position.y - 3000));
    if (this.shotsTxtContainer) {
      this.shotsTxtContainer.x = this.ball.position.x + TEXT_OFFSET.x;
      this.shotsTxtContainer.y = this.ball.position.y + TEXT_OFFSET.y;
    }
    this.handleOutOfShots();
  }
  handleTrail(time: number, delta: number) {
    if (!this.trailRope) return;
    if (Math.abs(this.ball.velocity.x) < 0.1 && Math.abs(this.ball.velocity.y) < 0.1) {
      this.trailRope.visible = false;
    } else {
      this.trailRope.visible = true;
      const trailParticle: TrailParticle = {
        timeToLive: 500,
        maxLifeTime: 500,
        pos: new Phaser.Math.Vector2(this.ball.position.x, this.ball.position.y),
      };
      this.trailParticles.push(trailParticle);
      const curve = new Phaser.Curves.Spline(this.trailParticles.flatMap((p) => [p.pos.x, p.pos.y]));
      this.trailRope.setDirty();

      const ropePoints = this.trailRope.points;
      const curvePoints = curve.getPoints(ropePoints.length - 1);
      for (let i = 0; i < curvePoints.length; i++) {
        ropePoints[i].x = curvePoints[i].x;
        ropePoints[i].y = curvePoints[i].y;
      }

      for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        const particle = this.trailParticles[i];
        particle.timeToLive -= delta;
        if (particle.timeToLive <= 0) {
          this.trailParticles.splice(i, 1);
        }
      }
    }
  }

  handleOutOfShots() {
    if (this.state === 'dead' || this.waitBeforeDieSubscription) return;
    if (
      this.shots <= 0 &&
      Math.abs(this.ball.velocity.y) < VELOCITY_DEADZONE &&
      Math.abs(this.ball.velocity.x) < VELOCITY_DEADZONE
    ) {
      this.waitBeforeDieSubscription = startWaitRoutine(this.scene, 3000)
        .pipe(take(1))
        .subscribe(() => {
          if (this.shots > 0) return; // we got a few more shots before
          this.startDieRoutine();
        });
    }
  }

  private destroyPhysicsObjects() {
    if (!this.ball) return;
    this.deadPos = new Phaser.Math.Vector2(this.ball.position.x, this.ball.position.y);
    this.scene.matter.world.remove(this.ball);
  }

  private destroy() {
    this.state = 'dead';
    this.removeEventListeners();
    this.spineObject.destroy();
    this.spineObject = null;
    this.shotsTxt.destroy();
    this.shotsTxt = null;
    this.shotsTxtContainer.destroy();
    this.shotsTxtContainer = null;
    this.ball = null;
    this.trailParticles.length = 0;
    this.trailRope.destroy();
    this.trailRope = null;
    emit(GameEvent.gameOver);
  }

  getShotsText() {
    return `SHOTS\n${this.shots} / ${MAX_SHOTS}`;
  }
  addShots(num: number) {
    this.shots += num;
    if (this.shots >= MAX_SHOTS) this.shots = MAX_SHOTS;
    this.shotsTxt.text = this.getShotsText();
    // make sure we don't die if we still have shots left
    if (this.shots > 0) {
      this.waitBeforeDieSubscription?.unsubscribe();
      this.waitBeforeDieSubscription = null;
      this.state = '';
    }
  }

  startDieRoutine() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.spineObject.animationState.setAnimation(0, 'dead', false);
    playPlayerDie();
    this.destroyPhysicsObjects();
    const animationStateListeners = {
      complete: (trackEntry) => {
        this.spineObject.animationState.removeListener(animationStateListeners);
        this.destroy();
      },
    };

    this.spineObject.animationState.addListener(animationStateListeners);
  }
  get x() {
    if (this.state === 'dead') return this.deadPos.x;
    return this.ball.position.x;
  }

  get y() {
    if (this.state === 'dead') return this.deadPos.y;
    return this.ball.position.y;
  }
  get eyeGroup(): Bone {
    return this.spineObject.skeleton.findBone('eye-group');
  }
}
