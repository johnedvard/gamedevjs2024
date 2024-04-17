import { take } from "rxjs/internal/operators/take";

import { SceneKey } from "~/enums/SceneKey";
import { loadLevel } from "~/utils/levelUtils";
import { LevelState } from "~/types/LevelState";
import { handleDebugInput } from "~/debugInput";
import { Player } from "~/Player";
import { Enemy } from "~/Enemy";

export class Level extends Phaser.Scene {
  levelState!: LevelState;
  player!: Player;
  enemies: Enemy[] = [];

  constructor() {
    super(SceneKey.Level);
  }

  preload(): void {
    loadLevel(this, "level")
      .pipe(take(1))
      .subscribe((levelState) => {
        console.log("levelState", levelState);
        this.levelState = levelState;
      });
  }

  create(): void {
    this.player = new Player(this, { startPos: this.levelState.startPos });
    this.createEnemies();
    handleDebugInput(this);
  }

  createEnemies() {
    this.levelState.enemies.forEach((e) => {
      this.enemies.push(new Enemy(this, { startPos: e.startPos }));
    });
  }

  update(time: number, delta: number): void {
    this.player?.update(time, delta);
    this.enemies.forEach((e) => e.update(time, delta));
  }
}
