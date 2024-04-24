export type LevelState = {
  startPos: Phaser.Math.Vector2;
  enemies: { startPos: Phaser.Math.Vector2 }[];
  holes: { startPos: Phaser.Math.Vector2 }[];
  powerPucks: { startPos: Phaser.Math.Vector2 }[];
  collisionCircles: { startPos: Phaser.Math.Vector2; radius: number }[];
  walls: { mainBoxes: MatterJS.BodyType[][]; excessBoxes: MatterJS.BodyType[][] };
  backgrounds: Phaser.GameObjects.Graphics[];
  wallGraphics: Phaser.GameObjects.Graphics[];
};
