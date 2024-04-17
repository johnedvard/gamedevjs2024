import { Scene } from "phaser";

import { Observable } from "rxjs/internal/Observable";

import { DepthGroup } from "~/enums/DepthGroup";
import { LevelState } from "~/types/LevelState";
import { SvgPath } from "~/types/SvgPath";

import { createPathsFromSvg, createCollisionBoxesFromPaths, getPosFromSvgCircle } from "~/utils/vectorUtils";

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
  const walls = createCollisionBoxesFromPaths(scene, svgPaths);
  createWallGraphics(scene, walls, { strokeWidth: 16, color: 0xff0066 }); // pink
  // createTextFromSvg(scene, svgDoc);

  const startPos = getPosFromSvgCircle(svgDoc.querySelector(`#start`));
  return { startPos };
}

function createWallGraphics(scene: Scene, walls: MatterJS.BodyType[], { strokeWidth, color }) {
  const graphics = scene.add.graphics().setDepth(DepthGroup.wall);

  const curve = new Phaser.Curves.Spline(walls.flatMap((w) => [w.position.x, w.position.y]));
  graphics.lineStyle(strokeWidth, color, 1);
  curve.draw(graphics, 264);
}
