import { Scene } from 'phaser';

import { GameEvent } from '~/enums/GameEvent';
import { emit } from '~/utils/eventEmitterUtils';
import { Player } from '~/Player';

type Line = { from: Phaser.Math.Vector2; to: Phaser.Math.Vector2 };
export class UserInput {
  isHoldingDown = false;
  holdDuration = 0;
  pointerStartPos: { x: number; y: number };
  pointerEndPos: { x: number; y: number };
  graphics: Phaser.GameObjects.Graphics;
  constructor(private scene: Scene, private player: Player) {
    this.listenForPointer();
    this.graphics = this.scene.add.graphics();
  }

  listenForPointer() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerStartPos = { x: pointer.position.x, y: pointer.position.y };
      this.isHoldingDown = true;
      emit(GameEvent.startBallThrow, { pos: new Phaser.Math.Vector2(pointer.x, pointer.y) });
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
    this.graphics.clear();
    if (!this.pointerEndPos || !this.pointerStartPos) return;
    const line = this.getMirroredPointerLine();
    // this.drawMirroredPointerLine(line);
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

  drawMirroredPointerLine(line: Line) {
    this.graphics.lineStyle(4, 0xffffff, 1);
    this.graphics.moveTo(line.from.x, line.from.y);
    this.graphics.lineTo(line.to.x, line.to.y);
    this.graphics.stroke();
  }

  drawPointerPathFromBall(line: Line) {
    this.graphics.lineStyle(4, 0xffffff, 1);
    const ballPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const line2 = {
      from: ballPos,
      to: ballPos.clone().add(new Phaser.Math.Vector2(line.to.x - line.from.x, line.to.y - line.from.y)),
    };

    this.graphics.moveTo(line2.from.x, line2.from.y);
    this.graphics.lineTo(line2.to.x, line2.to.y);

    this.graphics.stroke();
  }
}
