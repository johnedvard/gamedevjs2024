import { Scene } from 'phaser';

import { GameEvent } from '~/enums/GameEvent';
import { DepthGroup } from '~/enums/DepthGroup';
import { emit } from '~/utils/eventEmitterUtils';
import { Player } from '~/Player';

type Line = { from: Phaser.Math.Vector2; to: Phaser.Math.Vector2 };
export class UserInput {
  isHoldingDown = false;
  holdDuration = 0;
  pointerStartPos: { x: number; y: number };
  pointerEndPos: { x: number; y: number };
  trajectoryGraphics: Phaser.GameObjects.Graphics;
  trajectorypotentialGraphics: Phaser.GameObjects.Graphics;
  player: Player;

  constructor(private scene: Scene) {
    this.listenForPointer();
    this.trajectoryGraphics = this.scene.add.graphics();
    this.trajectoryGraphics.setDepth(DepthGroup.player);
    this.trajectorypotentialGraphics = this.scene.add.graphics();
    this.trajectorypotentialGraphics.setDepth(DepthGroup.player);
  }

  listenForPointer() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerStartPos = { x: pointer.position.x, y: pointer.position.y };
      this.isHoldingDown = true;
      emit(GameEvent.startBallThrow, { pos: new Phaser.Math.Vector2(pointer.position.x, pointer.position.y) });
    });
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.pointerEndPos = { x: pointer.position.x, y: pointer.position.y };
    });

    this.scene.input.on('pointerup', () => {
      let diffX = 0;
      let diffY = 0;
      if (this.pointerEndPos && this.pointerStartPos) {
        diffX = this.pointerEndPos.x - this.pointerStartPos.x;
        diffY = this.pointerEndPos.y - this.pointerStartPos.y;
      }
      this.pointerStartPos = null;
      this.pointerEndPos = null;
      this.isHoldingDown = false;
      emit(GameEvent.releaseBallThrow, { holdDuration: this.holdDuration, diffX, diffY });
    });
  }

  update(time: number, delta: number) {
    if (this.isHoldingDown) {
      this.holdDuration += delta;
    } else {
      this.holdDuration = 0;
    }
    this.updateTrajectory();
  }

  updateTrajectory() {
    this.trajectoryGraphics.clear();
    this.trajectorypotentialGraphics.clear();
    if (this.player.shots === 0 || this.player.state === 'dead') return;
    if (!this.pointerEndPos || !this.pointerStartPos) return;
    const line = this.getMirroredPointerLine();
    if (!this.player) return;
    this.drawPointerPathFromBall(line);
  }

  getMirroredPointerLine(): Line {
    const from = new Phaser.Math.Vector2(this.pointerStartPos.x, this.pointerStartPos.y);
    const diff = from.clone().subtract(new Phaser.Math.Vector2(this.pointerEndPos.x, this.pointerEndPos.y));
    const line = {
      from: from,
      to: diff.clone().add(from),
    };
    return line;
  }

  drawPointerPathFromBall(line: Line) {
    const ballPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const line2 = {
      from: ballPos,
      to: ballPos.clone().add(new Phaser.Math.Vector2(line.to.x - line.from.x, line.to.y - line.from.y)),
    };

    const minDistance = 50;
    const minDistanceToDrawPotentialDistance = 80;
    const maxDistance = 270;
    const maxLineWidth = 8;
    const minLineWidth = 3;
    const distance = line2.from.distance(line2.to);

    const diffNormalized: Phaser.Math.Vector2 = line2.to.clone().subtract(line2.from).normalize();
    diffNormalized.scale(maxDistance);
    const unitLength = 1 / maxDistance;
    const lineWidth = Math.min(distance, maxDistance) * unitLength * maxLineWidth;
    this.trajectoryGraphics.lineStyle(Math.max(minLineWidth, lineWidth), 0xffffff, 1);
    this.trajectorypotentialGraphics.lineStyle(Math.max(minLineWidth, lineWidth), 0xffffff, 0.4);
    // draw the potential to max length
    if (distance > minDistanceToDrawPotentialDistance) {
      this.trajectorypotentialGraphics.moveTo(line2.from.x, line2.from.y);
      this.trajectorypotentialGraphics.lineTo(line2.from.x + diffNormalized.x, line2.from.y + diffNormalized.y);
    }

    if (distance > maxDistance) {
      this.trajectoryGraphics.moveTo(line2.from.x, line2.from.y);
      this.trajectoryGraphics.lineTo(line2.from.x + diffNormalized.x, line2.from.y + diffNormalized.y);
    } else {
      this.trajectoryGraphics.moveTo(line2.from.x, line2.from.y);
      this.trajectoryGraphics.lineTo(line2.to.x, line2.to.y);
    }
    let yScale = 1;
    if (distance > 10) {
      yScale = distance / maxDistance;
      if (yScale < 1) yScale = 1;
      // this.player.spineObject.setScale(1,yScale)
      this.player.eyeGroup.rotation =
        Phaser.Math.RadToDeg(line2.from.clone().subtract(line2.to).angle() - Math.PI / 2) * -1;
    }
    if (distance > minDistance) {
      this.trajectoryGraphics.stroke();
      this.trajectorypotentialGraphics.stroke();
    }
  }

  setPlayer(player: Player) {
    this.player = player;
  }
}
