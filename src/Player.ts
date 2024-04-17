import { SpineGameObject } from '@esotericsoftware/spine-phaser';
import { Scene } from 'phaser';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';

type PlayerOptions = { startPos: Phaser.Math.Vector2 };
const BALL_RADIUS = 20;
export class Player {
  spineObject: SpineGameObject;
  ball: MatterJS.BodyType;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
  constructor(
    private scene: Scene,
    playerOptions: PlayerOptions,
  ) {
    this.startPoint = playerOptions.startPos;
    this.init();
  }
  init() {
    this.initSpine();
    this.scene.cameras.main.startFollow(this.spineObject, true, 0, 0.3);
  }
  initSpine() {
    this.spineObject = this.scene.add
      .spine(
        this.startPoint.x,
        this.startPoint.y,
        'player-skel',
        'player-atlas',
      )
      .setDepth(DepthGroup.player);
    this.ball = this.scene.matter.add.circle(
      this.startPoint.x,
      this.startPoint.y,
      BALL_RADIUS,
      {
        label: BodyTypeLabel.player,
      },
    );
    const force = new Phaser.Math.Vector2(
      (1 - Math.random() * 2) * 0.05,
      (1 - Math.random() * 2) * 0.05,
    );
    setInterval(() => {
      this.scene.matter.applyForce(this.ball, force);
    }, 1000);
    // this.spineObject.animationState.setAnimation(0, "blink", false);
  }
  update() {
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
  }
}
