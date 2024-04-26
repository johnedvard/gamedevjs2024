import { Scene } from 'phaser';
import { createText } from '~/utils/textUtils';
import { GAME_WIDTH } from '~/utils/gameUtils';
import { off, on } from '~/utils/eventEmitterUtils';
import { startAccumulateScoreRoutine } from '~/utils/animationUtils';
import { GameEvent } from '~/enums/GameEvent';
import { HIGH_SCORE_KEY, SCORE_KEY, getItem, setItem } from '~/utils/storageUtils';
import { Puck } from '~/Puck';

export class Score {
  scoreTxt: Phaser.GameObjects.Text;
  personalBestTxt: Phaser.GameObjects.Text;
  accumulateScoreTween: Phaser.Tweens.Tween;
  score = 0;

  constructor(private scene: Scene) {
    this.init();
  }
  init() {
    this.scoreTxt = createText(this.scene, GAME_WIDTH / 2, 100, 100, '0');
    this.personalBestTxt = createText(this.scene, GAME_WIDTH / 2, 155, 50, '');
    this.listenForEvents();
  }
  onPuckKilled = (data: { puck: Puck; points: number }) => {
    this.addScore(data.points);
  };

  onGameOver = () => {
    setItem(SCORE_KEY, `${this.score}`);
    const highscore = (getItem(HIGH_SCORE_KEY) as number) || 0;
    if (this.score > highscore) {
      // TODO (johnedvard) emit new record event
      // add confetty or similar;
      setItem(HIGH_SCORE_KEY, `${this.score}`);
      this.personalBestTxt.setText('NEW BEST: ' + this.score);
    } else {
      this.personalBestTxt.setText('BEST: ' + highscore);
    }
  };
  listenForEvents() {
    on(GameEvent.puckKilled, this.onPuckKilled);
    on(GameEvent.gameOver, this.onGameOver);
  }
  removeEventListeners() {
    off(GameEvent.puckKilled, this.onPuckKilled);
    off(GameEvent.gameOver, this.onGameOver);
  }
  addScore(score: number) {
    // TODO (john) accumulate a combo score to count correctly (instead of counting from 0)
    const fromScore = Math.max(0, this.score - 10);
    this.score += score;
    this.accumulateScoreTween?.stop();
    this.accumulateScoreTween = startAccumulateScoreRoutine(this.scene, this.score, fromScore, this.scoreTxt);
  }
  reset() {
    this.score = 0;
    this.scoreTxt.setText('0');
    this.personalBestTxt.setText('');
    this.accumulateScoreTween?.stop();
  }
}
