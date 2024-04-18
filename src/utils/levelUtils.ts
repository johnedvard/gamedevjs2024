import { Scene } from 'phaser';

import { Observable } from 'rxjs/internal/Observable';

import { DepthGroup } from '~/enums/DepthGroup';
import { MyColor } from '~/enums/MyColor';
import { LevelState } from '~/types/LevelState';
import { SvgPath } from '~/types/SvgPath';

import {
  createPathsFromSvg,
  createCollisionBoxesFromPaths,
  getPosFromSvgCircle,
  getEnemiesFromSvg,
  getHolesFromSvg,
} from '~/utils/vectorUtils';
import { GAME_HEIGHT, GAME_WIDTH } from './gameUtils';

const parser = new DOMParser();

export function loadLevel(scene: Scene, levelId: string): Observable<LevelState> {
  return new Observable((subscriber) => {
    scene.load.text(levelId, `assets/gamedevjs2024/svg/${levelId}.svg`);
    scene.load.on('filecomplete', (key: string, _type, svgText: string) => {
      if (key === levelId) {
        subscriber.next(createLevelFromSvg(scene, svgText));
      }
    });
  });
}

export function createLevelFromSvg(scene: Scene, svgText: string): LevelState {
  const svgDoc: Document = parser.parseFromString(svgText, 'image/svg+xml');
  const svgPaths = createPathsFromSvg(svgDoc);
  const walls = createCollisionBoxesFromPaths(scene, svgPaths);
  const enemies = getEnemiesFromSvg(svgDoc);
  const holes = getHolesFromSvg(svgDoc);
  createWallGraphics(scene, walls, { strokeWidth: 25, color: MyColor.pink }); // pink
  createBackgroundFromSvg(scene, svgPaths);
  const startPos = getPosFromSvgCircle(svgDoc.querySelector(`#start`));
  return { startPos, enemies, holes };
}

export function createFlooring(scene: Scene, startY: number, endY: number) {
  // TODO (johnedvard) Keep track of graphics and remove when outside of view
  const flooringHeight = 300;
  const graphics = scene.add.graphics().setDepth(DepthGroup.flooring);
  for (let y = startY; y > endY; ) {
    graphics.fillStyle(0x1f1f1f);
    const rect = new Phaser.Geom.Rectangle(0, y, GAME_WIDTH, flooringHeight);
    graphics.fillRectShape(rect);
    graphics.fillStyle(0x171717);
    rect.y -= flooringHeight;
    graphics.fillRectShape(rect);
    graphics.fillStyle(0x1c1c1c);
    rect.y -= flooringHeight;
    graphics.fillRectShape(rect);
    graphics.fillStyle(0x191919);
    rect.y -= flooringHeight;
    graphics.fillRectShape(rect);
    rect.y -= flooringHeight;
    y = rect.y;
  }
}

function createBackgroundFromSvg(scene: Scene, svgPaths: SvgPath[]) {
  const graphics = scene.add.graphics().setDepth(DepthGroup.background);
  graphics.fillStyle(MyColor.black);
  svgPaths.forEach(({ path, svgPathEl }) => {
    if (!svgPathEl.getAttribute('serif:id')?.match('{background}')) return;
    graphics.fillPoints(path.getPoints(200));
  });
}
function createWallGraphics(scene: Scene, walls: MatterJS.BodyType[], { strokeWidth, color }) {
  const graphics = scene.add.graphics().setDepth(DepthGroup.wall);

  const curve = new Phaser.Curves.Spline(walls.flatMap((w) => [w.position.x, w.position.y]));
  graphics.lineStyle(strokeWidth, color, 1);
  // graphics.fillStyle(MyColor.black);
  // graphics.fillPoints(curve.getPoints(200))
  curve.draw(graphics, 200);
}
