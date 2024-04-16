import { Scene } from "phaser";

import { Observable } from "rxjs/internal/Observable";

import { DepthGroup } from "~/enums/DepthGroup";
import { LevelState } from "~/types/LevelState";
import { SvgPath } from "~/types/SvgPath";

import {
  createPathsFromSvg,
  createCollisionBoxesFromPaths,
  getPosFromSvgCircle,
} from "~/utils/vectorUtils";

const parser = new DOMParser();

export function loadLevel(scene: Scene, levelId: string): Observable<LevelState> {
  return new Observable((subscriber) => {
    scene.load.text(levelId, `assets/gamedevjs2024/svg/${levelId}.svg`);
    scene.load.on("filecomplete", (key: string, _type, svgText: string) => {
      if (key === levelId) {
        subscriber.next(createLevelFromSvg(scene, svgText));
      }
    });
  });
}

export function createLevelFromSvg(scene: Scene, svgText: string): LevelState {
  const svgDoc: Document = parser.parseFromString(svgText, "image/svg+xml");
  const svgPaths = createPathsFromSvg(svgDoc);
  createCollisionBoxesFromPaths(scene, svgPaths);
  createWallGraphics(scene, svgPaths);
  // createTextFromSvg(scene, svgDoc);

  const startPos = getPosFromSvgCircle(svgDoc.querySelector(`#start`));
  return { startPos };
}

function createWallGraphics(scene: Scene, svgPaths: SvgPath[]){
  const graphics = scene.add.graphics().setDepth(DepthGroup.wall);
  svgPaths.forEach(({ path, svgPathEl, strokeWidth, color }) => {
    if (!svgPathEl.getAttribute('serif:id')?.match('{collision}')) return;
    if (color != null) {
      graphics.lineStyle(strokeWidth, color, 1);
    } else {
      graphics.lineStyle(0, 0, 0);
    }
    path.draw(graphics);
  });
}