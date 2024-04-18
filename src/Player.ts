import { Scene } from 'phaser';
import { Bone, SpineGameObject } from '@esotericsoftware/spine-phaser';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { emit, off, on } from '~/utils/eventEmitterUtils'
import { createText } from '~/utils/textUtils';
import { startWaitRoutine } from './utils/gameUtils';
import { Subscription, take } from 'rxjs';

type PlayerOptions = { startPos: Phaser.Math.Vector2 };
const BALL_RADIUS = 23;
const MAX_SHOTS = 5;
const TEXT_OFFSET = new Phaser.Math.Vector2(2,70);
const RELASE_DEADZONE = 20;
const VELOCITY_DEADZONE = 2;
export class Player {
  spineObject: SpineGameObject;
  hole: SpineGameObject;
  ball: MatterJS.BodyType;
  startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200, 200);
  deadPos: Phaser.Math.Vector2; // store the position we died
  controlBone: Bone;
  waitBeforeDieSubscription: Subscription;
  state: '' | 'dead' = '';
  shots = 5;
  
  handleShotsTxtTween: Phaser.Tweens.Tween;
  shotsTxt: Phaser.GameObjects.Text;
  shotsTxtContainer: Phaser.GameObjects.Container;

  constructor(
    private scene: Scene,
    playerOptions: PlayerOptions
  ) {
    this.startPoint = playerOptions.startPos;
    this.init();
  }
  init() {
    this.initSpineObject();
    this.initPhysics();
    this.listenForEvents();
    this.initShotsTxt();
    
  }

  initShotsTxt(){
    // TODO (johnedvard) move to a new class
    this.shotsTxt = createText(this.scene,0,0, 50, this.getShotsText(),{align:'center'});
    this.shotsTxtContainer = this.scene.add.container(this.x + TEXT_OFFSET.x, this.y + TEXT_OFFSET.y, this.shotsTxt).setDepth(DepthGroup.ui);
    
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

  onStartBallThrow = () => {
    this.handleShotsTxtTween?.stop();
    this.shotsTxt.alpha = 1;
  }

  onReleaseBallThrow = ({ holdDuration, diffX, diffY }: { holdDuration: number; diffX: number; diffY: number }) => {
    console.log('on release ball')
    this.handleShotsTxtTween?.stop();
    this.handleShotsTxtTween = this.scene.tweens.add({targets: this.shotsTxt, duration:2000, alpha: 0, delay: 2000,ease: Phaser.Math.Easing.Quadratic.InOut })
    
    if(Math.abs(diffX) < RELASE_DEADZONE && Math.abs(diffY) < RELASE_DEADZONE) return;
    if(this.shots <= 0) return;
    const force = new Phaser.Math.Vector2(Math.min(1, diffX / -300), Math.max(-1, diffY / -300)).scale(0.12);
    this.scene.matter.applyForce(this.ball, force);
    this.addShots(-1);
    // this.spineObject.setScale(1,1);
  };

  fallInHole = (data: { other: MatterJS.BodyType }) => {
    if (data.other === this.ball) {
     this.startDieRoutine();
    } else if(data.other.label === BodyTypeLabel.enemy){
      this.addShots(1);
    }
  };

  listenForEvents() {
    on(GameEvent.startBallThrow, this.onStartBallThrow);
    on(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    on(GameEvent.fallInHole, this.fallInHole);
  }

  removeEventListeners() {
    console.log('remove event listeners');
    off(GameEvent.startBallThrow, this.onStartBallThrow);
    off(GameEvent.releaseBallThrow, this.onReleaseBallThrow);
    off(GameEvent.fallInHole, this.fallInHole);
  }

  update(time: number, delta: number) {
    if (this.state === 'dead') return;
    this.spineObject.setPosition(this.ball.position.x, this.ball.position.y);
    if(this.shotsTxtContainer){
      this.shotsTxtContainer.x = this.ball.position.x + TEXT_OFFSET.x;
      this.shotsTxtContainer.y = this.ball.position.y + TEXT_OFFSET.y
    }
    // this.spineObject.setRotation(this.ball.angle);
    this.handleOutOfShots();
  }

  handleOutOfShots(){
    if(this.state === 'dead' || this.waitBeforeDieSubscription) return;
    if(this.shots <= 0 && Math.abs(this.ball.velocity.y) < VELOCITY_DEADZONE && Math.abs(this.ball.velocity.x) < VELOCITY_DEADZONE){
      this.waitBeforeDieSubscription = startWaitRoutine(this.scene,3000).pipe(take(1)).subscribe(() => {
        this.startDieRoutine();
      }) 
    }
  }


  private destroyPhysicsObjects() {
    this.deadPos = new Phaser.Math.Vector2(this.ball.position.x, this.ball.position.y);
    this.scene.matter.world.remove(this.ball);
    this.ball = null;
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
    emit(GameEvent.gameOver);
  }

  getShotsText(){
    return `SHOTS\n${this.shots} / ${MAX_SHOTS}`;
  }
  addShots(num: number){
    this.shots += num;
    this.shotsTxt.text = this.getShotsText();
    if(this.shots >= MAX_SHOTS) this.shots = MAX_SHOTS;
    if(this.state === 'dead' && this.shots>0){
      this.waitBeforeDieSubscription?.unsubscribe();
      this.waitBeforeDieSubscription = null;
      this.state = '';
    }
  }
  startDieRoutine(){
    this.spineObject.animationState.setAnimation(0, 'dead', false);
    this.destroyPhysicsObjects();
    this.state = 'dead';
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
  get x() {
    if (this.state === 'dead') return this.deadPos.x;
    return this.ball.position.x;
  }

  get y() {
    if (this.state === 'dead') return this.deadPos.y;
    return this.ball.position.y;
  }
}
