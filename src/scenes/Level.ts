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

export class Level extends Phaser.Scene {
  levelIntro!: LevelState;
  levelSvgs: string[] = [];
  player!: Player;
  userInput!: UserInput;
  enemies: Enemy[] = [];
  holes: Hole[] = [];
  discharge: Discharge;
  playerPosZoneInterval = 3000; //load next zone for each 3000px
  currentZone = 0;
  createdTime = Infinity;

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
  }

  initLevel(levelState: LevelState) {
    this.player = new Player(this, { startPos: levelState.startPos });
    this.userInput.setPlayer(this.player);
    this.createEnemies(levelState);
    this.createHoles(levelState);
    this.discharge = new Discharge(this);
    this.discharge.setPlayer(this.player);
  }

  addLevel(levelState: LevelState) {
    this.createEnemies(levelState);
    this.createHoles(levelState);
  }

  create(): void {
    this.userInput = new UserInput(this);
    this.listenForEvents();
    this.initLevel(this.levelIntro);
    handleDebugInput(this);
    this.scene.launch(SceneKey.HUD);
  }

  listenForEvents() {
    on(GameEvent.gameOver, this.onGameOver);
    on(GameEvent.replay, this.onReplay);
  }

  removeEventListeners() {
    off(GameEvent.gameOver, this.onGameOver);
    off(GameEvent.replay, this.onReplay);
  }

  onGameOver = () => {
    this.scene.launch(SceneKey.GameOver);
  };

  onReplay = () => {
    this.destroyGameObjects();
    this.initLevel(this.levelIntro);
  };

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
    if (this.createdTime === Infinity) this.createdTime = time;
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
    if (time > this.createdTime + 3000) this.handleLevelZones();
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
    this.discharge.destroy();
    this.holes = [];
    this.enemies = [];
  }
}
