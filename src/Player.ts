import { Scene } from 'phaser';
import { Bone, SpineGameObject } from '@esotericsoftware/spine-phaser';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { off, on } from '~/utils/eventEmitterUtils';
import { UserInput } from '~/UserInput';

type PlayerOptions = { startPos: Phaser.Math.Vector2 };
const BALL_RADIUS = 23;
export class Player {
  spineObject: SpineGameObject;
  hole: SpineGameObject;
  ball: MatterJS.BodyType;
  userInput: UserInput;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
  deadPos: Phaser.Math.Vector2; // store the position we died
  controlBone: Bone;
  state: '' | 'dead' = '';

  constructor(
    private scene: Scene,
    playerOptions: PlayerOptions
  ) {
    this.startPoint = playerOptions.startPos;
    this.init();
  }
  init() {
    this.userInput = new UserInput(this.scene, this);
    this.initSpineObject();
    this.initPhysics();
    this.listenForEvents();
  }

  initSpineObject() {
    this.spineObject = this.scene.add
      .spine(this.startPoint.x, this.startPoint.y, 'enemy-skel', 'enemy-atlas')
      .setDepth(DepthGroup.player);
    this.spineObject.skeleton.setSkinByName('player');
    this.scene.cameras.main.startFollow(this.spineObject, true, 0, 0.3);
  }

  initPhysics() {
    this.ball = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, BALL_RADIUS, {
      label: BodyTypeLabel.player,
      frictionAir: 0.03,
      friction: 0.2,
      restitution: 0.5,
    });
  }
  onReleaseBallThrow = ({ holdDuration, diffX, diffY }: { holdDuration: number; diffX: number; diffY: number }) => {
    const force = new Phaser.Math.Vector2(Math.min(1, diffX / -300), Math.max(-1, diffY / -300)).scale(0.12);
    this.scene.matter.applyForce(this.ball, force);
    // this.spineObject.setScale(1,1);
  };

  inHole = (data: { other: MatterJS.BodyType }) => {
    if (data.other === this.ball) {
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
    on(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    on(GameEvent.inHole, this.inHole);
  }

  removeEventListeners() {
    off(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    off(GameEvent.inHole, this.inHole);
  }

  update(time: number, delta: number) {
    if (this.state === 'dead') return;
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    // this.spineObject.setRotation(this.ball.angle);
    this.userInput.update(time, delta);
  }

  destroyPhysicsObjects() {
    this.deadPos = new Phaser.Math.Vector2(this.ball.position.x, this.ball.position.y);
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
    if (this.state === 'dead') return this.deadPos.x;
    return this.ball.position.x;
  }

  get y() {
    if (this.state === 'dead') return this.deadPos.y;
    return this.ball.position.y;
  }
}
