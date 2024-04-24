import { Scene } from 'phaser';
// TODO (johnedvard) move to scene plugin
export function handleDebugInput(scene: Scene) {
  scene.matter.world.drawDebug = false;
  if (scene.input && scene.input.keyboard) {
    scene.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
      if (evt.code === 'KeyT') {
        if (scene.matter.world.drawDebug) {
          scene.matter.world.drawDebug = false;
          scene.matter.world.debugGraphic?.clear();
        } else {
          scene.matter.world.drawDebug = true;
        }
      }
      if (evt.code === 'KeyJ') {
        scene.matter.world.debugConfig.showJoint = !scene.matter.world.debugConfig.showJoint;
      }
    });
  }
}
