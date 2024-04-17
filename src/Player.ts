import { Scene } from "phaser";
import { SpineGameObject } from "@esotericsoftware/spine-phaser";

import { BodyTypeLabel } from "~/enums/BodyTypeLabel";
import { DepthGroup } from "~/enums/DepthGroup";
import { GameEvent } from "~/enums/GameEvent";
import { on } from "~/utils/eventEmitterUtils";
import { UserInput } from "~/UserInput";

type PlayerOptions = { startPos: Phaser.Math.Vector2 };
const BALL_RADIUS = 23;
export class Player {
  spineObject: SpineGameObject;
  ball: MatterJS.BodyType;
  userInput: UserInput;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
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
    this.listenForEvents();
  }
  initSpineObject() {
    this.spineObject = this.scene.add
      .spine(this.startPoint.x, this.startPoint.y, "player-skel", "player-atlas")
      .setDepth(DepthGroup.player);
    this.ball = this.scene.matter.add.circle(this.startPoint.x, this.startPoint.y, BALL_RADIUS, {
      label: BodyTypeLabel.player,
      frictionAir: 0.03,
      friction: 0.2,
      restitution: 0.5,
    });

    // this.spineObject.animationState.setAnimation(0, "blink", false);
    this.scene.cameras.main.startFollow(this.spineObject, true, 0, 0.3);
  }
  onReleaseBallThrow = ({ holdDuration, diffX, diffY }: { holdDuration: number; diffX: number; diffY: number }) => {
    const force = new Phaser.Math.Vector2(Math.min(1, diffX / -300), Math.max(-1, diffY / -300)).scale(0.08);
    this.scene.matter.applyForce(this.ball, force);
    // this.spineObject.setScale(1,1);
  };
  listenForEvents() {
    on(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
  }
  update(time: number, delta: number) {
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    // this.spineObject.setRotation(this.ball.angle);
    this.userInput.update(time, delta);
  }
  get x() {
    return this.ball.position.x;
  }
  get y() {
    return this.ball.position.y;
  }
}
