import { take } from 'rxjs/internal/operators/take';

import { SceneKey } from '~/enums/SceneKey';
import { loadLevel } from '~/utils/levelUtils';
import { LevelState } from '~/types/LevelState';
import { handleDebugInput } from '~/debugInput';
import { Player } from '~/Player';
import { Enemy } from '~/Enemy';
import { Hole } from '~/Hole';
import { off, on } from '~/utils/eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';
import { UserInput } from '~/UserInput';

export class Level extends Phaser.Scene {
  levelState!: LevelState;
  player!: Player;
  userInput!: UserInput;
  enemies: Enemy[] = [];
  holes: Hole[] = [];

  constructor() {
    super(SceneKey.Level);
  }

  preload(): void {
    loadLevel(this, 'level')
      .pipe(take(1))
      .subscribe((levelState) => {
        console.log('levelState', levelState);
        this.levelState = levelState;
      });
  }

  initLevel() {
    this.player = new Player(this, { startPos: this.levelState.startPos });
    this.userInput.setPlayer(this.player);
    this.createEnemies();
    this.createHoles();
    this.scene.launch(SceneKey.HUD);
  }

  create(): void {
    this.userInput = new UserInput(this);
    this.listenForEvents();
    this.initLevel();
    handleDebugInput(this);
  }

  removeEventListeners() {
    off(GameEvent.gameOver, this.onGameOver);
    off(GameEvent.replay, this.onReplay);
  }

  listenForEvents() {
    on(GameEvent.gameOver, this.onGameOver);
    on(GameEvent.replay, this.onReplay);
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
