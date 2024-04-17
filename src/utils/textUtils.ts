import { Scene } from "phaser";
import { DepthGroup } from "~/enums/DepthGroup";
import { MyColor } from "~/enums/MyColor";
import { isWideScreen } from "~/utils/gameUtils";

export function createText(scene: Scene, x: number, y: number, size: number, startText = '', textOptions?): Phaser.GameObjects.Text {
    if (isWideScreen()) size = size * 1.3;
    return scene.add
      .text(x, y, startText, {
        fontFamily: 'TiltNeon',
        fontSize: `${size}pt`,
        color: MyColor.pinkStr,
        padding: { x: 10, y: 10 },
        ...textOptions
      })
      .setShadow(3, 4, `#00000099`, 1, true, true)
      .setOrigin(0.5, 0.5)
      .setDepth(DepthGroup.ui)
      .setScale(0.5);
  }