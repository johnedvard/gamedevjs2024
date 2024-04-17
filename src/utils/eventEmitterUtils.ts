const emitter = new Phaser.Events.EventEmitter();
export const emit = (evt: string, data?: any) => emitter.emit(evt, data);
export const on = (evt: string, callback: (...args) => void) => emitter.on(evt, callback);
export const off = (evt: string, callback: (...args) => void) => emitter.off(evt, callback);
