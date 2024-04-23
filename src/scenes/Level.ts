import { take } from 'rxjs/internal/operators/take';

import { SceneKey } from '~/enums/SceneKey';
import { createFlooring, createLevelFromSvg, loadLevel } from '~/utils/levelUtils';
import { LevelState } from '~/types/LevelState';
import { handleDebugInput } from '~/debugInput';
import { Player } from '~/Player';
import { Enemy } from '~/Enemy';
import { Hole } from '~/Hole';
import { off, on } from '~/utils/eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';
import { UserInput } from '~/UserInput';
import { Discharge } from '~/Discharge';
import { DepthGroup } from '~/enums/DepthGroup';
import { GAME_WIDTH } from '~/utils/gameUtils';

export class Level extends Phaser.Scene {
  levelIntro!: LevelState;
  levelSvgs: string[] = [];
  player!: Player;
  userInput!: UserInput;
  enemies: Enemy[] = [];
  holes: Hole[] = [];
  collisionCircles: { circle: MatterJS.BodyType; graphics: Phaser.GameObjects.Graphics }[] = [];
  discharge: Discharge;
  playerPosZoneInterval = 3000; //load next zone for each 3000px
  currentZone = 0;

  constructor() {
    super(SceneKey.Level);
  }

  preload(): void {
    loadLevel(this, 'level-intro')
      .pipe(take(1))
      .subscribe((levelSvgText) => {
        this.levelIntro = createLevelFromSvg(this, levelSvgText);
        createFlooring(this, this.playerPosZoneInterval, -this.playerPosZoneInterval);
      });
    loadLevel(this, 'level-1')
      .pipe(take(1))
      .subscribe((levelSvgText) => {
        this.levelSvgs.push(levelSvgText);
      });
    handleDebugInput(this);
  }

  initLevel(levelState: LevelState) {
    this.currentZone = 0;
    this.player = new Player(this, { startPos: levelState.startPos });
    this.userInput.setPlayer(this.player);
    this.createEnemies(levelState);
    this.createHoles(levelState);
    this.createCollisionCircles(levelState);
    this.discharge = new Discharge(this);
    this.discharge.setPlayer(this.player);
  }

  addLevel(levelState: LevelState) {
    this.createCollisionCircles(levelState);
    this.createEnemies(levelState);
    this.createHoles(levelState);
  }

  create(): void {
    this.userInput = new UserInput(this);
    this.listenForEvents();
    this.initLevel(this.levelIntro);

    this.scene.launch(SceneKey.HUD);
  }

  onResize = () => {
    this.cameras.main.centerOnX(GAME_WIDTH / 2 + 2);
  };
  onFullscreen = () => {
    console.log('on fullscreen');
    this.cameras.main.centerOnX(GAME_WIDTH / 2 + 2);
  };
  listenForEvents() {
    on(GameEvent.gameOver, this.onGameOver);
    on(GameEvent.replay, this.onReplay);
    on(GameEvent.resize, this.onResize);
    on(GameEvent.fullscreen, this.onFullscreen);
  }

  removeEventListeners() {
    off(GameEvent.gameOver, this.onGameOver);
    off(GameEvent.replay, this.onReplay);
    off(GameEvent.resize, this.onResize);
    off(GameEvent.fullscreen, this.onFullscreen);
  }

  onGameOver = () => {
    this.scene.launch(SceneKey.GameOver);
  };

  onReplay = () => {
    this.destroyGameObjects();
    this.initLevel(this.levelIntro);
  };

  createCollisionCircles(levelState: LevelState) {
    levelState.collisionCircles.forEach((c) => {
      const circleGeom = new Phaser.Geom.Circle(c.startPos.x, c.startPos.y, c.radius);
      const circle = this.matter.add.circle(c.startPos.x, c.startPos.y, c.radius, { isStatic: true });
      const graphics = this.add.graphics({
        fillStyle: { color: 0xff0066, alpha: 1 },
        lineStyle: { width: 8, color: 0xff0066, alpha: 1 },
      });
      graphics.setDepth(DepthGroup.background);
      graphics.fillCircleShape(circleGeom);
      this.collisionCircles.push({ circle, graphics });
    });
  }
  createEnemies(levelState: LevelState) {
    // this.enemies.forEach(e => e.destroyEverything());
    // this.enemies = [];
    levelState.enemies.forEach((e) => {
      this.enemies.push(new Enemy(this, { startPos: e.startPos }));
    });
  }

  createHoles(levelState: LevelState) {
    // this.holes.forEach(h => h.destroyEverything());
    // this.holes = [];
    levelState.holes.forEach((h) => {
      this.holes.push(new Hole(this, this.player, { startPos: h.startPos }));
    });
  }

  update(time: number, delta: number): void {
    if (!this.player) return;
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
    this.discharge?.update(time, delta);
    this.handleLevelZones();
  }

  handleLevelZones() {
    const zoneLine = this.playerPosZoneInterval * this.currentZone * -1;
    if (this.player.y - 1000 < zoneLine) {
      const level1 = createLevelFromSvg(
        this,
        this.levelSvgs[this.currentZone],
        this.playerPosZoneInterval * ++this.currentZone * -1
      );
      this.addLevel(level1);
      createFlooring(this, zoneLine, zoneLine - 3000, 0x021827);
    }
  }

  destroyGameObjects() {
    // No need to destroy player, because it destroys itself
    this.player = null;
    this.enemies.forEach((e) => e.destroyEverything());
    this.holes.forEach((e) => e.destroyEverything());
    this.collisionCircles.forEach((collisionCircle) => {
      this.matter.world.remove(collisionCircle.circle);
      collisionCircle.graphics.destroy();
      collisionCircle.graphics = null;
      collisionCircle.circle = null;
    });
    this.discharge.destroy();
    this.holes = [];
    this.enemies = [];
    this.collisionCircles = [];

    // TODO (johnedvard) Make it possible to remove and add walls similar to collisionCircles
    // this.levelIntro.walls.mainBoxes.forEach(group => group.forEach(b => this.matter.world.remove(b)))
    // this.levelIntro.walls.excessBoxes.forEach(group => group.forEach(b => this.matter.world.remove(b)))
  }
}
