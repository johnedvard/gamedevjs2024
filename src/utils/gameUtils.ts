import { Scene } from 'phaser';
import { Bone } from '@esotericsoftware/spine-phaser';

import { Observable } from 'rxjs/internal/Observable';

import { DepthGroup } from '~/enums/DepthGroup';
import { SceneKey } from '~/enums/SceneKey';

export const GAME_WIDTH = 750;
export const GAME_HEIGHT = 1334;

let backgroundGrapics;

export const getCanvas = (): HTMLCanvasElement => {
  return document.querySelector('#my-game');
};

export const getCenter = (scene: Scene): Phaser.Math.Vector2 => {
  return new Phaser.Math.Vector2(scene.cameras.main.centerX, scene.cameras.main.centerY);
};

export const updateAim = (aimBone: Bone, pos: Phaser.Math.Vector2) => {
  if (!aimBone) return;
  aimBone.rotation = Phaser.Math.RadToDeg(Phaser.Math.Angle.BetweenPoints({ x: aimBone.x, y: aimBone.y }, pos)) + 65;
};

export function getSquashedAddress(address: string) {
  return address.substring(0, 5) + '...' + address.substring(address.length - 4);
}

export function getFullWidth(scene: Scene) {
  return scene.cameras.main.width;
}

export function getFullHeight(scene: Scene) {
  return scene.cameras.main.height;
}

export function centerScene(scene: Scene) {
  scene.cameras.main.setBounds(
    -getFullWidth(scene) / 2 + GAME_WIDTH / 2,
    -getFullHeight(scene) / 2 + GAME_HEIGHT / 2,
    0,
    Infinity
  );
}

export function isPointOutsideCircle(
  point: Phaser.Math.Vector2,
  circleCenter: Phaser.Math.Vector2,
  circleRadius: number
) {
  const distance = Phaser.Math.Distance.Between(point.x, point.y, circleCenter.x, circleCenter.y);

  return distance > circleRadius;
}
export const createBackground = (scene: Scene) => {
  if (scene && scene.scene.key === SceneKey.GameOver) return;
  if (backgroundGrapics) backgroundGrapics.clear();
  backgroundGrapics = scene.add.graphics().setDepth(DepthGroup.gameBackground);
  backgroundGrapics.fillGradientStyle(0xaa0202, 0x20aa20, 0x303030, 0x0303aa);
  backgroundGrapics.fillRect(-window.innerWidth, -window.innerHeight, window.innerWidth * 4, window.innerHeight * 3);
};

// TODO (john) convert to a subscription that can be cancelled instead
export function startWaitRoutine(scene: Scene, waitTime: number): Observable<void> {
  return new Observable<void>((subscriber) => {
    let ellapsedTime = 0;
    const gameUpdateListener = (_time: number, delta: number) => {
      ellapsedTime += delta;
      if (ellapsedTime >= waitTime) {
        scene.events.off(Phaser.Scenes.Events.UPDATE, gameUpdateListener);
        subscriber.next();
      }
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, gameUpdateListener);
  });
}

export function getSeconds(time) {
  // TODO (johnedvard) Move to own method
  const totalSeconds = Math.floor(time / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - 60 * minutes;
  const sec10 = Math.floor(seconds / 10);
  const sec = seconds % 10;
  return `${sec10 > 0 ? sec10 : ''}${sec}`;
}

export function isWideScreen() {
  return window.innerWidth > 500;
}
