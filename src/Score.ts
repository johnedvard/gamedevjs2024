import { Scene } from 'phaser';
import { createText } from '~/utils/textUtils';
import { GAME_WIDTH } from '~/utils/gameUtils';
import { off, on } from '~/utils/eventEmitterUtils';
import { startAccumulateScoreRoutine } from '~/utils/animationUtils';
import { GameEvent } from '~/enums/GameEvent';
import { Enemy } from './Enemy';
import { HIGH_SCORE_KEY, SCORE_KEY, getItem, setItem } from './utils/storageUtils';

export class Score {
  scoreTxt: Phaser.GameObjects.Text;
  personalBestTxt: Phaser.GameObjects.Text;
  accumulateScoreTween: Phaser.Tweens.Tween;
  score = 0;

  constructor(private scene: Scene) {
    this.init();
  }
  init() {
    this.scoreTxt = createText(this.scene, GAME_WIDTH / 2, 100, 80, '0');
    this.personalBestTxt = createText(this.scene, GAME_WIDTH / 2, 135, 30, '');
    this.listenForEvents();
  }
  onEnemyKilled = (data: { emeny: Enemy }) => {
    this.addScore(1);
  };

  onGameOver = () => {
    setItem(SCORE_KEY, `${this.score}`);
    const highscore = (getItem(HIGH_SCORE_KEY) as number) || 0;
    this.personalBestTxt.setText('BEST: ' + highscore);
    if (this.score > highscore) {
      // TODO (johnedvard) emit new record event
      // add confetty or similar;
      setItem(HIGH_SCORE_KEY, `${this.score}`);
    }
  };
  listenForEvents() {
    on(GameEvent.enemyKilled, this.onEnemyKilled);
    on(GameEvent.gameOver, this.onGameOver);
  }
  removeEventListeners() {
    off(GameEvent.enemyKilled, this.onEnemyKilled);
    off(GameEvent.gameOver, this.onGameOver);
  }
  addScore(score: number) {
    const currentScore = this.score;
    this.score += score;
    this.accumulateScoreTween?.stop();
    this.accumulateScoreTween = startAccumulateScoreRoutine(this.scene, this.score, currentScore, this.scoreTxt);
  }
  reset() {
    this.score = 0;
    this.scoreTxt.setText('0');
    this.personalBestTxt.setText('');
    this.accumulateScoreTween?.stop();
  }
}
