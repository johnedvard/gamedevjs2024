import { Scene } from 'phaser';

import svgToPhaserPath from 'svg-to-phaser-path';

import { BodyTypeLabel } from '~/enums/BodyTypeLabel';
import { MyColor } from '~/enums/MyColor';
import { SvgPath } from '~/types/SvgPath';

type ButtonConfig = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  borderRadius?: number;
  scale?: number;
  onButtonDown?: () => void;
  fill?: any;
};

export const getPosFromSvgCircle = (circleElement: SVGElement): Phaser.Math.Vector2 => {
  if (!circleElement) return new Phaser.Math.Vector2(0, 0);
  const cx = circleElement.getAttribute('cx');
  const cy = circleElement.getAttribute('cy');
  if (!cx || !cy) return null;
  return new Phaser.Math.Vector2(~~cx, ~~cy);
};

export const getRadiusFromSvgCircle = (circleElement: SVGElement): number => {
  if (!circleElement) 0;
  const radius = circleElement.getAttribute('r');
  if (!radius) return 0;
  return ~~radius;
};

export const getPosFromSvgRect = (svgEl: SVGElement): Phaser.Math.Vector2 => {
  let x = svgEl.getAttribute('x');
  let y = svgEl.getAttribute('y');
  if (x.match('px')) x = x.split('px')[0];
  if (y.match('px')) y = y.split('px')[0];
  if (!x || !y) return null;
  return new Phaser.Math.Vector2(~~x, ~~y);
};
export const getHeightFromSvgRect = (svgEl: SVGElement): number => {
  let height = svgEl.getAttribute('height');

  if (height.match('px')) height = height.split('px')[0];
  if (!height) return 0;
  return ~~height;
};
export const createPathsFromSvg = (svgDoc: Document): SvgPath[] => {
  const svgPaths: SvgPath[] = [];
  const pathEls = svgDoc.querySelectorAll('path');
  pathEls.forEach((el) => {
    if (el.getAttribute('id') === 'tree-area') return;
    const jsonPath = svgToPhaserPath(el.getAttribute('d'));
    const path = new Phaser.Curves.Path(jsonPath);
    const color: number = rgbTohex(el.style.stroke);
    const fill: number = rgbTohex(el.style.fill);
    svgPaths.push({
      path,
      svgPathEl: el,
      strokeWidth: getStrokeWidth(el),
      color,
      fill,
    });
  });
  return svgPaths;
};

export const createCollisionBoxesFromPaths = (scene: Scene, svgPaths: SvgPath[], offsetY = 0) => {
  const mainBoxes: MatterJS.BodyType[][] = [];
  const excessBoxes: MatterJS.BodyType[][] = [];
  for (let x = 0; x < 2; x++) {
    // hack to overlap boxes, preventing puck from tunneling through cracks (most of the time)
    svgPaths.forEach(({ path, svgPathEl }) => {
      if (!svgPathEl.getAttribute('serif:id')?.match('{collision}')) return;
      const collisionGroup = [];
      const allPoints = path.getPoints(9 + x * 3);
      allPoints.forEach((p) => (p.y += offsetY));
      const offset = 30; // thichness of boxes
      for (let i = 0; i < allPoints.length - 1; i++) {
        const p0 = allPoints[i];
        const p1 = allPoints[i + 1];
        const { l0, l1 } = getParallellLine(p0, p1, offset);

        const box = scene.matter.add.fromVertices((p1.x + p0.x) / 2, (p1.y + p0.y) / 2, [p0, l0, l1, p1], {
          isStatic: true,
          label: BodyTypeLabel.collisionWall,
          ignoreGravity: true,
          restitution: 0.2,
          friction: 0,
          frictionStatic: 0,
        });
        collisionGroup.push(box);
      }
      if (x === 1) {
        mainBoxes.push(collisionGroup);
      } else if (x === 0) {
        excessBoxes.push(collisionGroup);
      }
    });
  }
  scene.matter.bounds.create(mainBoxes);
  return { mainBoxes, excessBoxes };
};

export const createTextFromSvg = (scene: Scene, svgDoc: Document) => {
  const textelements = svgDoc.querySelectorAll('text');

  for (const el of textelements) {
    // TODO (johnedvard) deal with attributes not containing 'px'
    const x = ~~el.getAttribute('x').split('px')[0];
    const y = ~~el.getAttribute('y').split('px')[0];
    const fontSize = ~~el.style.fontSize.split('px')[0];
    const bitmapText = scene.add.bitmapText(x, y, 'atari', el.innerHTML, fontSize).setAlpha(1).setOrigin(0.2, 0.6);
    bitmapText.setTint(0x000000);
  }
};

// See https://stackoverflow.com/a/3627747/1471485
export const rgbTohex = (rgb: string) => {
  if (!rgb || rgb === 'none') return null;
  return parseInt(
    `0x${rgb
      .match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
      .slice(1)
      .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('')}`
  );
};

export const getStrokeWidth = (svgPathEl: SVGElement) => {
  const defaultStrokeWidth = 6;
  if (!svgPathEl) return defaultStrokeWidth;
  try {
    return parseFloat(svgPathEl.style.strokeWidth);
  } catch (err) {
    return defaultStrokeWidth;
  }
};

const getParallellLine = (
  p0: Phaser.Math.Vector2,
  p1: Phaser.Math.Vector2,
  offset: number
): { l0: Phaser.Math.Vector2; l1: Phaser.Math.Vector2 } => {
  const [dx, dy] = [p0.x - p1.x, p0.y - p1.y];
  const scale = offset / (dx * dx + dy * dy) ** 0.5;
  const [ox, oy] = [-dy * scale, dx * scale];

  // parallell lines. See https://stackoverflow.com/a/63538916/1471485
  const l0 = new Phaser.Math.Vector2(ox + p0.x, oy + p0.y);
  const l1 = new Phaser.Math.Vector2(ox + p1.x, oy + p1.y);
  return { l0, l1 };
};

const getGameObjectsFromSvg = (svgDoc: Document, offsetY = 0, groupMatch: string, posMatch: string) => {
  const objs = [];
  const els = svgDoc.querySelectorAll(`g[id^='${groupMatch}']`);
  els.forEach((el) => {
    const pos = getPosFromSvgCircle(el.querySelector(`circle[id^='${posMatch}']`));
    pos.y += offsetY;
    objs.push({ startPos: pos });
  });
  return objs;
};

export const getEnemiesFromSvg = (svgDoc: Document, offsetY = 0) => {
  return getGameObjectsFromSvg(svgDoc, offsetY, 'Enemy', 'enemyPos');
};

export const getPowerPucksFromSvg = (svgDoc: Document, offsetY = 0) => {
  return getGameObjectsFromSvg(svgDoc, offsetY, 'PowerPuck', 'powerPos');
};

export const getHolesFromSvg = (svgDoc: Document, offsetY = 0) => {
  return getGameObjectsFromSvg(svgDoc, offsetY, 'Hole', 'holePos');
};

export const getCollisionCirclesFromSvg = (svgDoc: Document, offsetY = 0) => {
  const cicles = [];
  const ciclesEl = svgDoc.querySelectorAll("circle[id^='_-collisionCircle']");
  ciclesEl.forEach((el) => {
    const circlePos = getPosFromSvgCircle(el as SVGElement);
    const radius = getRadiusFromSvgCircle(el as SVGElement);
    circlePos.y += offsetY;
    cicles.push({ startPos: circlePos, radius });
  });
  return cicles;
};

export const createButtonGraphics = (scene: Scene, config?: ButtonConfig): Phaser.GameObjects.Graphics => {
  const graphics = scene.add.graphics();
  const btnWidth = config.width || 100;
  const btnHeight = config.height || 100;
  const radius = config.borderRadius || 15;
  const fill = config.fill || MyColor.pink;

  const rect = new Phaser.Geom.Rectangle(0, 0, btnWidth, btnHeight);
  graphics.fillStyle(0xff7423, 0);
  graphics.lineStyle(5, fill, 1);
  graphics.translateCanvas(-rect.width / 2, -rect.height / 2);
  graphics.setPosition(config.x, config.y); // set origin to center
  rect.x -= rect.width / 2; // make up for the canvas translation
  rect.y -= rect.height / 2;
  if (config.onButtonDown) {
    graphics.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
    graphics.on('pointerdown', config.onButtonDown, this);
  }
  graphics.fillRoundedRect(0, 0, rect.width, rect.height, radius);
  graphics.stroke();
  return graphics;
};
