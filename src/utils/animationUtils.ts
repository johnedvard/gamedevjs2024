import { Scene } from 'phaser';
import { DepthGroup } from '~/enums/DepthGroup';

export function startAccumulateScoreRoutine(scene: Scene, totalScore: number, comboScore: number, text) {
  return scene.tweens.addCounter({
    from: totalScore - comboScore,
    to: totalScore,
    duration: 500,
    ease: Phaser.Math.Easing.Linear,
    onUpdate: (tween) => {
      const value = Math.round(tween.getValue());
      text.setText(`${value}`);
    },
  });
}

export function playRingAnimation(scene: Scene, pos: Phaser.Math.Vector2) {
  const ellipseGraphics = scene.add.graphics({ lineStyle: { width: 5, color: 0xffffff } }).setDepth(DepthGroup.hole);
  scene.tweens.add({
    targets: [ellipseGraphics],
    width: { from: 60, to: 105 },
    height: { from: 60, to: 100 },
    alpha: { from: 0.9, to: 0 },
    ease: Phaser.Math.Easing.Expo.Out,
    duration: 1000,
    onUpdate: function () {
      this.targets.forEach((t) => {
        t.clear();
        t.strokeEllipse(pos.x, pos.y, t.width, t.height);
      });
    },
    onComplete: function () {
      this.targets.forEach((t) => {
        t.clear();
      });
    },
  });
}
