// order is important, because first item in enum is 0
export enum DepthGroup {
  gameBackground = 0,
  flooring = 10000,
  background = 20000,
  wall = 30000,
  hole = 40000,
  particleFront = 50000,
  player = 60000,
  ui = 70000,
}
