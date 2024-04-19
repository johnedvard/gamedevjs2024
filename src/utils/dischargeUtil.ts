import { Scene } from 'phaser';
import { DepthGroup } from '~/enums/DepthGroup';
import { emit } from './eventEmitterUtils';
import { GameEvent } from '~/enums/GameEvent';
import { Player } from '~/Player';

export function startDischargeAnimation(scene: Scene, player: Player, dischargeBoundryGeom: Phaser.Geom.Circle) {
  let dischargeGraphic = scene.add.graphics().setDepth(DepthGroup.player);
  dischargeGraphic.fillStyle(0xffffff, 0.98);
  dischargeGraphic.fillCircleShape(dischargeBoundryGeom);
  dischargeGraphic.setScale(0.1, 0.1);
  scene.tweens.add({ targets: dischargeGraphic, scale: 1, duration: 300 });
  let isTweenComplete = false;
  const gameUpdateListener = (_time: number, delta: number) => {
    if (player && dischargeGraphic) {
      dischargeGraphic.x = player.x;
      dischargeGraphic.y = player.y;
    }
    if (isTweenComplete) {
      scene.events.off(Phaser.Scenes.Events.UPDATE, gameUpdateListener);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, gameUpdateListener);

  let dischargeTween = scene.tweens.chain({
    targets: dischargeGraphic,
    tweens: [
      {
        scale: 1.05,
        ease: Phaser.Math.Easing.Quadratic.Out,
        duration: 300,
      },
      {
        scale: 1,
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 150,
      },
      {
        scale: 0.98,
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 500,
      },
      {
        scale: 0,
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 180,
        onComplete: () => {
          dischargeGraphic.destroy();
          dischargeGraphic = null;
          dischargeTween.destroy();
          dischargeTween = null;
          isTweenComplete = true;
          emit(GameEvent.dischargeComplete);
        },
      },
    ],
  });
}
