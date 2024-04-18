import { Scene } from 'phaser';
import { DepthGroup } from '~/enums/DepthGroup';
import { MyColor } from '~/enums/MyColor';
import { createButtonGraphics } from '~/utils/vectorUtils';

export function createText(
  scene: Scene,
  x: number,
  y: number,
  size: number,
  startText = '',
  textOptions?
): Phaser.GameObjects.Text {
  size = size * 1.3;
  return scene.add
    .text(x, y, startText, {
      fontFamily: 'ConcertOne',
      fontSize: `${size}px`,
      color: MyColor.pinkStr,
      padding: { x: 10, y: 10 },
      letterSpacing: '10px',
      ...textOptions,
    })
    .setShadow(3, 4, `#00000099`, 1, true, true)
    .setOrigin(0.5, 0.5)
    .setDepth(DepthGroup.ui)
    .setScale(0.5);
}
export function createButton(scene: Scene, x: number, y: number, width: number, height: number, onClick, text = '') {
  const container = scene.add.container(x, y).setDepth(DepthGroup.ui);
  const largeBtn = createButtonGraphics(scene, {
    x,
    y,
    width,
    height,
    onButtonDown: onClick,
  }).setDepth(DepthGroup.ui);
  const largeBtnShadow = createButtonGraphics(scene, {
    x,
    y: y + 4,
    width,
    height,
    fill: MyColor.pinkShadow,
  }).setDepth(DepthGroup.ui);
  const txt = createText(scene, x, y, height, text);
  container.add(txt);
  container.add(largeBtnShadow);
  container.add(largeBtn);
  return container;
}
