import { take } from 'rxjs/internal/operators/take';

import { SceneKey } from '~/enums/SceneKey';
import { createFlooring, createLevelFromSvg, loadLevel } from '~/utils/levelUtils';
import { LevelState } from '~/types/LevelState';
import { handleDebugInput } from '~/debugInput';
import { Player } from '~/Player';
import { Hole } from '~/Hole';
import { off, on } from '~/utils/eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';
import { UserInput } from '~/UserInput';
import { Discharge } from '~/Discharge';
import { DepthGroup } from '~/enums/DepthGroup';
import { GAME_WIDTH } from '~/utils/gameUtils';
import { Puck } from '~/Puck';
import { shuffle } from 'lodash';
import { getRandomFloorColor } from '~/utils/colorUtils';

type LevelStateManagement = {
  levelState: LevelState;
  graphics: Phaser.GameObjects.Graphics[];
};
export class Level extends Phaser.Scene {
  levelIntro!: LevelState;
  levelStateMangement: LevelStateManagement[] = [];
  levelSvgs: string[] = [];
  player!: Player;
  userInput!: UserInput;
  pucks: Puck[] = [];
  holes: Hole[] = [];
  levelCount = 4;
  levelsLoaded = 0;
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
    for (let i = 0; i < this.levelCount; i++) {
      loadLevel(this, `level-${i + 1}`)
        .pipe(take(1))
        .subscribe((levelSvgText) => {
          this.levelsLoaded++;
          this.levelSvgs.push(levelSvgText);
          if (this.levelsLoaded == this.levelCount) {
            this.levelSvgs = shuffle(this.levelSvgs); // make levels load randomly
          }
        });
    }
    handleDebugInput(this);
  }

  initLevel(levelState: LevelState) {
    this.currentZone = 0;
    this.player = new Player(this, { startPos: levelState.startPos });
    this.userInput.setPlayer(this.player);
    this.createEnemies(levelState);
    this.createHoles(levelState);
    this.createPowerPucks(levelState);
    this.createCollisionCircles(levelState);
    this.discharge = new Discharge(this);
    this.discharge.setPlayer(this.player);
  }

  addLevel(management: LevelStateManagement) {
    this.createCollisionCircles(management.levelState);
    this.createEnemies(management.levelState);
    this.createHoles(management.levelState);
    this.createPowerPucks(management.levelState);
    this.levelStateMangement.push(management);

    if (this.levelStateMangement.length >= 3 && this.currentZone >= 3) {
      // TODO (johnedvard) also remove other game objects the same way.
      this.destroyLevelState(this.levelStateMangement[0]);
      this.levelStateMangement.splice(0, 1);
    }
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
    this.levelSvgs = shuffle(this.levelSvgs);
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
      this.pucks.push(new Puck(this, { startPos: e.startPos, puckType: 'enemy' }));
    });
  }

  createHoles(levelState: LevelState) {
    // this.holes.forEach(h => h.destroyEverything());
    // this.holes = [];
    levelState.holes.forEach((h) => {
      this.holes.push(new Hole(this, this.player, { startPos: h.startPos }));
    });
  }

  createPowerPucks(levelState: LevelState) {
    levelState.powerPucks.forEach((p) => {
      this.pucks.push(new Puck(this, { startPos: p.startPos, puckType: 'powerpuck' }));
    });
  }

  update(time: number, delta: number): void {
    if (!this.player) return;
    this.userInput?.update(time, delta);
    this.player?.update(time, delta);

    for (let i = this.pucks.length - 1; i >= 0; i--) {
      const e = this.pucks[i];
      e.update(time, delta);
      if (e.isDestroyed) {
        this.pucks[i] = null;
        this.pucks.splice(i, 1);
      }
    }
    this.holes.forEach((e) => e.update(time, delta));
    this.discharge?.update(time, delta);
    this.handleLevelZones();
  }

  handleLevelZones() {
    const zoneLine = this.playerPosZoneInterval * this.currentZone * -1;
    if (this.player.y - 1000 < zoneLine) {
      const level = createLevelFromSvg(
        this,
        this.levelSvgs[this.currentZone % this.levelCount], //
        this.playerPosZoneInterval * ++this.currentZone * -1
      );
      const flooringGraphics = createFlooring(this, zoneLine, zoneLine - 3000, getRandomFloorColor());
      const levelGraphics = [];
      levelGraphics.push(flooringGraphics);
      level.backgrounds.forEach((g) => levelGraphics.push(g));
      level.wallGraphics.forEach((g) => levelGraphics.push(g));
      this.addLevel({ levelState: level, graphics: levelGraphics });
    }
  }

  destroyGameObjects() {
    // No need to destroy player, because it destroys itself
    this.player = null;
    this.pucks.forEach((e) => e.destroyEverything());
    this.holes.forEach((e) => e.destroyEverything());
    this.collisionCircles.forEach((collisionCircle) => {
      this.matter.world.remove(collisionCircle.circle);
      collisionCircle.graphics.destroy();
    });

    this.discharge.destroy();
    this.holes = [];
    this.pucks = [];
    this.collisionCircles = [];

    // TODO (johnedvard) Let Level add walls to the scene, and then clean up
    this.levelStateMangement.forEach((management) => {
      this.destroyLevelState(management);
    });
    this.levelStateMangement = [];
  }
  destroyLevelState(management: LevelStateManagement) {
    management.levelState.walls.mainBoxes.forEach((group) =>
      group.forEach((b) => {
        this.matter.world.remove(b);
      })
    );
    management.levelState.walls.excessBoxes.forEach((group) =>
      group.forEach((b) => {
        this.matter.world.remove(b);
      })
    );
    management.graphics.forEach((g) => {
      g.clear();
      g.destroy();
    });
  }
}
