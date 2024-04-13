const { DESTROY, SHUTDOWN, START, UPDATE } = Phaser.Scenes.Events;

export class MatterFixedStepPlugin extends Phaser.Plugins.ScenePlugin {
  accum = 0;

  boot() {
    if (!this.systems.matterPhysics) {
      throw new Error('Matter Physics must be enabled in this scene');
    }

    if (this.systems.matterPhysics.config.autoUpdate) {
      throw new Error('Matter Physics `autoUpdate` must be turned off');
    }

    this.systems.events
      .on(START, this.sceneStart, this)
      .on(SHUTDOWN, this.sceneShutdown, this)
      .on(DESTROY, this.sceneDestroy, this)
      .on(UPDATE, this.sceneUpdate, this);
  }

  sceneDestroy() {
    this.systems.events
      .off(START, this.sceneStart, this)
      .off(SHUTDOWN, this.sceneShutdown, this)
      .off(DESTROY, this.sceneDestroy, this)
      .off(UPDATE, this.sceneUpdate, this);
  }

  sceneStart() {}

  sceneShutdown() {}

  sceneUpdate(time, delta) {
    const { matterPhysics } = this.systems;
    const { deltaMin } = matterPhysics.world.runner;

    this.accum += delta;

    while (this.accum >= deltaMin) {
      matterPhysics.step(deltaMin);

      this.accum -= deltaMin;
    }
  }
}
