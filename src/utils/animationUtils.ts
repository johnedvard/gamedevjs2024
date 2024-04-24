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

export function playExplotionAnimation(scene: Scene, pos: Phaser.Math.Vector2) {
  const circleGraphics = scene.add.graphics({ fillStyle: { color: 0xffffff, alpha: 1 } }).setDepth(DepthGroup.hole);
  scene.tweens.add({
    targets: [circleGraphics],
    radius: { from: 50, to: 120 },
    alpha: { from: 1, to: 0 },
    ease: Phaser.Math.Easing.Expo.Out,
    duration: 850,
    onUpdate: function () {
      this.targets.forEach((t) => {
        t.clear();
        t.fillCircle(pos.x, pos.y, t.radius);
      });
    },
    onComplete: function () {
      this.targets.forEach((t) => {
        t.clear();
        t.destroy();
      });
    },
  });
}
export function playRingAnimation(scene: Scene, pos: Phaser.Math.Vector2) {
  const ellipseGraphics = scene.add.graphics({ lineStyle: { width: 5, color: 0xffffff } }).setDepth(DepthGroup.hole);
  const circleGraphics = scene.add.graphics({ fillStyle: { color: 0xffffff, alpha: 1 } }).setDepth(DepthGroup.hole);
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
        t.destroy();
      });
    },
  });
  circleGraphics.fillCircle(pos.x, pos.y, 40);
  scene.tweens.add({
    targets: circleGraphics,
    color: 0x000000,
    alpha: 0,
    delay: 30,
    ease: Phaser.Math.Easing.Expo.Out,
    duration: 750,
    onComplete: () => {
      circleGraphics.destroy();
    },
  });
}
