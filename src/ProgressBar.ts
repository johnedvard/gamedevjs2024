import { Scene } from 'phaser';
import { MyColor } from './enums/MyColor';

export class ProgressBar {
  constructor(private scene: Scene) {
    this.addProgressBar();
  }
  addProgressBar() {
    const progressBox = this.scene.add.graphics();
    const progressBoxInner = this.scene.add.graphics();
    const progressBar = this.scene.add.graphics();
    progressBox.fillStyle(MyColor.pink, 1);
    progressBox.fillRoundedRect(
      this.scene.cameras.main.width / 2 - 154,
      this.scene.cameras.main.height / 2,
      308,
      40,
      3
    );
    progressBoxInner.fillStyle(0x000000, 1);
    progressBoxInner.fillRoundedRect(
      this.scene.cameras.main.width / 2 - 150,
      this.scene.cameras.main.height / 2 + 5,
      300,
      30,
      3
    );
    this.scene.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(MyColor.pink, 0.4);
      progressBar.fillRoundedRect(
        this.scene.cameras.main.width / 2 - 150,
        this.scene.cameras.main.height / 2 + 5,
        300 * value,
        30,
        3
      );
    });
    this.scene.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });
  }
}
