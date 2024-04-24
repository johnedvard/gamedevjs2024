import { Scene } from 'phaser';

import { SpineGameObject } from '@esotericsoftware/spine-phaser';

import { DepthGroup } from '~/enums/DepthGroup';
import { PuckType } from '~/types/PuckType';
import { BodyTypeLabel } from '~/enums/BodyTypeLabel';

export function getSkinByType(puckType: PuckType) {
  let skin = 'regular';
  switch (puckType) {
    case 'powerpuck':
      skin = 'powerpuck';
      break;
    case 'enemy':
    default:
  }
  return skin;
}

export function createPuckByType(scene: Scene, startPoint: Phaser.Math.Vector2, puckType: PuckType): SpineGameObject {
  const spineObject = scene.add
    .spine(startPoint.x, startPoint.y, 'enemy-skel', 'enemy-atlas')
    .setDepth(DepthGroup.player);
  spineObject.skeleton.setSkinByName(getSkinByType(puckType));
  spineObject.animationState.timeScale = 0.5;
  return spineObject;
}

export function createBallByType(
  scene: Scene,
  startPoint: Phaser.Math.Vector2,
  radius: number,
  puckType: PuckType
): MatterJS.BodyType {
  let label = BodyTypeLabel.enemy;
  switch (puckType) {
    case 'powerpuck':
      label = BodyTypeLabel.powerPuck;
      break;
    case 'enemy':
    default:
  }
  return scene.matter.add.circle(startPoint.x, startPoint.y, radius, {
    label,
    frictionAir: 0.028,
    friction: 0.1,
    restitution: 0.9,
  });
}
