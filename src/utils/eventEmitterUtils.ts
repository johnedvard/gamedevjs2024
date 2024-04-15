const emitter = new Phaser.Events.EventEmitter();
export const emit = (evt: string, data?: any) => emitter.emit(evt, data);
export const on = (evt: string, callback: () => any) =>
  emitter.on(evt, callback);
export const off = (evt: string, callback: () => any) =>
  emitter.off(evt, callback);
