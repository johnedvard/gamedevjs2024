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
  getCollisionCirclesFromSvg,
  getPowerPucksFromSvg,
} from '~/utils/vectorUtils';
import { GAME_WIDTH } from '~/utils/gameUtils';

const parser = new DOMParser();

export function loadLevel(scene: Scene, levelId: string): Observable<string> {
  return new Observable((subscriber) => {
    scene.load.text(levelId, `assets/gamedevjs2024/svg/${levelId}.svg`);
    scene.load.on('filecomplete', (key: string, _type, svgText: string) => {
      if (key === levelId) {
        subscriber.next(svgText);
      }
    });
  });
}

export function createLevelFromSvg(scene: Scene, svgText: string, offsetY = 0): LevelState {
  const svgDoc: Document = parser.parseFromString(svgText, 'image/svg+xml');
  const svgPaths = createPathsFromSvg(svgDoc);
  const walls = createCollisionBoxesFromPaths(scene, svgPaths, offsetY);
  const enemies = getEnemiesFromSvg(svgDoc, offsetY);
  const powerPucks = getPowerPucksFromSvg(svgDoc, offsetY);
  const holes = getHolesFromSvg(svgDoc, offsetY);
  const collisionCircles = getCollisionCirclesFromSvg(svgDoc, offsetY);
  const wallGraphics = createWallGraphics(scene, walls.mainBoxes, { strokeWidth: 25, color: MyColor.pink }); // pink
  const backgrounds = createBackgroundFromSvg(scene, svgPaths, offsetY);
  const startPos = getPosFromSvgCircle(svgDoc.querySelector(`#start`));
  return { startPos, enemies, holes, collisionCircles, walls, powerPucks, backgrounds, wallGraphics };
}

export function createFlooring(scene: Scene, startY: number, endY: number, color: number = 0x1f1f1f) {
  const orgColor = color;
  // TODO (johnedvard) Keep track of graphics and remove when outside of view
  const flooringHeight = 300;
  const graphics = scene.add.graphics().setDepth(DepthGroup.flooring);
  for (let y = startY; y > endY; ) {
    graphics.fillStyle(color);
    const rect = new Phaser.Geom.Rectangle(0, y, GAME_WIDTH, flooringHeight);
    graphics.fillRectShape(rect);
    color = orgColor + 0x040404;
    graphics.fillStyle(color);
    rect.y -= flooringHeight;
    graphics.fillRectShape(rect);
    color = orgColor - 0x020202;
    graphics.fillStyle(color);
    rect.y -= flooringHeight;
    graphics.fillRectShape(rect);
    color = orgColor + 0x020202;
    graphics.fillStyle(color);
    rect.y -= flooringHeight;
    graphics.fillRectShape(rect);
    rect.y -= flooringHeight;
    y = rect.y;
    color = orgColor;
  }
  return graphics;
}

function createBackgroundFromSvg(scene: Scene, svgPaths: SvgPath[], offsetY = 0) {
  const backgrounds = [];
  svgPaths.forEach(({ path, svgPathEl }) => {
    if (!svgPathEl.getAttribute('serif:id')?.match('{background}')) return;
    const graphics = scene.add.graphics().setDepth(DepthGroup.ui);
    graphics.fillStyle(MyColor.black);
    const pathPoints = path.getPoints(10);
    pathPoints.forEach((p) => (p.y += offsetY));
    graphics.fillPoints(pathPoints);
    backgrounds.push(graphics);
  });
  return backgrounds;
}
function createWallGraphics(scene: Scene, walls: MatterJS.BodyType[][], { strokeWidth, color }) {
  const wallGraphics = [];
  walls.forEach((group) => {
    const graphics = scene.add.graphics().setDepth(DepthGroup.wall);
    const curve = new Phaser.Curves.Spline(group.flatMap((w) => [w.position.x, w.position.y]));
    graphics.lineStyle(strokeWidth, color, 1);
    curve.draw(graphics, 175);
    wallGraphics.push(graphics);
  });
  return wallGraphics;
}
