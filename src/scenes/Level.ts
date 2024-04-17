import { take } from 'rxjs/internal/operators/take';

import { SceneKey } from '~/enums/SceneKey';
import { loadLevel } from '~/utils/levelUtils';
import { LevelState } from '~/types/LevelState';
import { handleDebugInput } from '~/debugInput';
import { Player } from '~/Player';
import { Enemy } from '~/Enemy';
import { Hole } from '~/Hole';

export class Level extends Phaser.Scene {
  levelState!: LevelState;
  player!: Player;
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

  create(): void {
    this.player = new Player(this, { startPos: this.levelState.startPos });
    this.createEnemies();
    this.createHoles();
    handleDebugInput(this);
  }

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
    this.player?.update(time, delta);
    this.enemies.forEach((e) => e.update(time, delta));
    this.holes.forEach((e) => e.update(time, delta));
  }
}
