import { DepthGroup } from '~/enums/DepthGroup';
import { GameEvent } from '~/enums/GameEvent';
import { SceneKey } from '~/enums/SceneKey';
import { playUiClick } from '~/utils/audioUtils';
import { emit } from '~/utils/eventEmitterUtils';
import { GAME_WIDTH, centerScene } from '~/utils/gameUtils';
import { createButton, createText } from '~/utils/textUtils';

export class GameOver extends Phaser.Scene {
  retryScreenObjects = [];
  constructor() {
    super(SceneKey.GameOver);
  }
  preload(): void {}
  create(): void {
    console.log('Game Over.\nRetry?');
    this.displayRetryScreen();
    centerScene(this);
    this.createOverlay();
  }
  update(): void {}

  onReplay = () => {
    playUiClick();
    emit(GameEvent.replay);
    this.scene.stop();
  };

  createOverlay() {
    const backdropGraphics = this.add.graphics().setDepth(DepthGroup.background);
    backdropGraphics.fillStyle(0x000000, 0.75);
    backdropGraphics.fillRect(-window.innerWidth, -window.innerHeight, window.innerWidth * 4, window.innerHeight * 4);
  }

  displayRetryScreen() {
    this.retryScreenObjects = [];
    const tryAgainText = createText(this, GAME_WIDTH / 2, 490, 120, 'Game Over\nTry Again?', { align: 'center' });
    const yesBtn = createButton(this, GAME_WIDTH / 2 - 190, 370, 200, 120, this.onReplay, 'YES');

    [tryAgainText].forEach((text) => {
      this.tweens.add({
        targets: text,
        y: text.y - 20,
        duration: 2500,
        yoyo: true,
        loop: -1,
        ease: Phaser.Math.Easing.Quadratic.InOut,
      });
    });
    this.retryScreenObjects.push(tryAgainText, yesBtn);
  }
}
