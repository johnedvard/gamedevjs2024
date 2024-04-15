import { Scene } from "phaser";
import { Observable } from "rxjs/internal/Observable";
import { LevelState } from "~/types/LevelState";

import {
  createPathsFromSvg,
  createCollisionBoxesFromPaths,
  createTextFromSvg,
  getPosFromSvgCircle,
} from "~/utils/vectorUtils";

const parser = new DOMParser();

export function loadLevel(levelId: string): Observable<LevelState> {
  return new Observable((subscriber) => {
    this.load.text(levelId, `levels/${levelId}.svg`);
    this.load.on("filecomplete", (key: string, _type, svgText: string) => {
      if (key === levelId) {
        subscriber.next(createLevelFromSvg(this, svgText));
      }
    });
  });
}

export function createLevelFromSvg(scene: Scene, svgText: string): LevelState {
  const svgDoc: Document = parser.parseFromString(svgText, "image/svg+xml");
  this.svgPaths = createPathsFromSvg(svgDoc);
  createCollisionBoxesFromPaths(scene, this.svgPaths);
  createTextFromSvg(scene, svgDoc);

  const startPos = getPosFromSvgCircle(svgDoc.querySelector(`#start`));

  return { startPos };
}
