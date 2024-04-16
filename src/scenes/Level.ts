import { take } from "rxjs/internal/operators/take";

import { SceneKey } from "~/enums/SceneKey";
import { loadLevel } from "~/utils/levelUtils";
import { Player } from "~/scenes/Player";
import { LevelState } from "~/types/LevelState";


export class Level extends Phaser.Scene {
  levelState: LevelState;
  constructor() {
    super(SceneKey.Level);
  }
  preload(): void {
    loadLevel(this,'level').pipe(take(1)).subscribe(levelState => {
      console.log('levelState', levelState)
      this.levelState = levelState;
    });
  }
  
  create(): void {
    new Player(this,{startPos: this.levelState.startPos})
  }
  update(): void {}
}
