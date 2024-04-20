import { Scene } from 'phaser';

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
