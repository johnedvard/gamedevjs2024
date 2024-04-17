export type LevelState = {
  startPos: Phaser.Math.Vector2;
  enemies: { startPos: Phaser.Math.Vector2 }[];
  holes: { startPos: Phaser.Math.Vector2 }[];
};
