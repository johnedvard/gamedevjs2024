import { take } from 'rxjs/internal/operators/take';

import { SceneKey } from '~/enums/SceneKey';
import { createFlooring, loadLevel } from '~/utils/levelUtils';
import { LevelState } from '~/types/LevelState';
import { handleDebugInput } from '~/debugInput';
import { Player } from '~/Player';
import { Enemy } from '~/Enemy';
import { Hole } from '~/Hole';
import { off, on } from '~/utils/eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';
import { UserInput } from '~/UserInput';
import { DepthGroup } from '~/enums/DepthGroup';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';

const DISCARGE_CIRCLE_RADIUS = 270;

export class Level extends Phaser.Scene {
  levelState!: LevelState;
  player!: Player;
  userInput!: UserInput;
  enemies: Enemy[] = [];
  holes: Hole[] = [];
  dischargeCircle: MatterJS.BodyType; // follows player (maybe move it into own class or inside player)
  dischargeBoundryGeom: Phaser.Geom.Circle; // follows player (maybe move it into own class or inside player)
  dischargeBoundryGraphics: Phaser.GameObjects.Graphics; // follows player (maybe move it into own class or inside player)
  displayDischargePreview = false;

  constructor() {
    super(SceneKey.Level);
  }

  preload(): void {
    loadLevel(this, 'level')
      .pipe(take(1))
      .subscribe((levelState) => {
        console.log('levelState', levelState);
        this.levelState = levelState;
        createFlooring(this, this.levelState.startPos.y, this.levelState.startPos.y - 90000);
      });
  }

  createDischargeCircle() {
    this.dischargeCircle = this.matter.add.circle(0, 0, DISCARGE_CIRCLE_RADIUS, {
      isSensor: true,
      label: BodyTypeLabel.dischargeCircle,
    });
    this.dischargeBoundryGeom = new Phaser.Geom.Circle(0, 0, DISCARGE_CIRCLE_RADIUS);
    this.dischargeBoundryGraphics = this.add.graphics().setDepth(DepthGroup.particleFront);
  }
  initLevel() {
    this.player = new Player(this, { startPos: this.levelState.startPos });
    this.userInput.setPlayer(this.player);
    this.createEnemies();
    this.createHoles();
    this.createDischargeCircle();
    this.scene.launch(SceneKey.HUD);
  }

  create(): void {
    this.userInput = new UserInput(this);
    this.listenForEvents();
    this.initLevel();
    handleDebugInput(this);
  }

  onBatteryDischarged = () => {
    // create power field around player in a radius r,
    // wipe out enemies inside the area
    this.displayDischargePreview = false;
  };

  onDischargePreview = () => {
    console.log('preview plz');
    this.displayDischargePreview = true;
  };

  onDischargeDismissPreview = () => {
    console.log('dismiss preview plz');
    this.displayDischargePreview = false;
  };

  listenForEvents() {
    on(GameEvent.gameOver, this.onGameOver);
    on(GameEvent.replay, this.onReplay);
    on(GameEvent.batteryDischarge, this.onBatteryDischarged);
    on(GameEvent.batteryDischargePreview, this.onDischargePreview);
    on(GameEvent.batteryDischargeDismissPreview, this.onDischargeDismissPreview);
  }

  removeEventListeners() {
    off(GameEvent.gameOver, this.onGameOver);
    off(GameEvent.replay, this.onReplay);
    off(GameEvent.batteryDischarge, this.onBatteryDischarged);
    off(GameEvent.batteryDischargePreview, this.onDischargePreview);
    off(GameEvent.batteryDischargeDismissPreview, this.onDischargeDismissPreview);
  }

  onGameOver = () => {
    this.scene.launch(SceneKey.GameOver);
  };

  onReplay = () => {
    this.destroyGameObjects();
    this.initLevel();
  };

  createEnemies() {
    this.levelState.enemies.forEach((e) => {
      this.enemies.push(new Enemy(this, { startPos: e.startPos }));
    });
  }

  createHoles() {
    this.levelState.holes.forEach((h) => {
      this.holes.push(new Hole(this, this.player, { startPos: h.startPos }));
    });
  }

  update(time: number, delta: number): void {
    this.userInput?.update(time, delta);
    this.player?.update(time, delta);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(time, delta);
      if (e.isDestroyed) {
        this.enemies[i] = null;
        this.enemies.splice(i, 1);
      }
    }
    this.holes.forEach((e) => e.update(time, delta));
    this.handleDischargeUpdates();
  }

  handleDischargeUpdates() {
    if (this.dischargeCircle) {
      this.dischargeCircle.position.x = this.player.x;
      this.dischargeCircle.position.y = this.player.y;
    }
    this.dischargeBoundryGraphics.clear();
    if (this.dischargeBoundryGraphics && this.displayDischargePreview) {
      this.dischargeBoundryGraphics.lineStyle(3, 0xfefefe, 0.5);
      this.dischargeBoundryGraphics.fillStyle(0xfefefe, 0.05);
      this.dischargeBoundryGraphics.x = this.player.x;
      this.dischargeBoundryGraphics.y = this.player.y;
      this.dischargeBoundryGraphics.fillCircleShape(this.dischargeBoundryGeom);
      this.dischargeBoundryGraphics.strokeCircleShape(this.dischargeBoundryGeom);
    }
  }

  destroyGameObjects() {
    // No need to destroy player, because it destroys itself
    this.player = null;
    this.enemies.forEach((e) => e.destroyEverything());
    this.holes.forEach((e) => e.destroyEverything());
    this.holes = [];
    this.enemies = [];
  }
}
