import { EventEmitter } from 'events';
import { AppEvents } from './event.types';
import { logger } from '../../utils/logger';

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Increase max listeners for multiple sessions and modules
    this.emitter.setMaxListeners(100);
  }

  public emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
    logger.debug({ event, payload }, `[EventBus] Emitted: ${event}`);
    return this.emitter.emit(event, payload);
  }

  public on<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  public once<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
    this.emitter.once(event, listener);
    return this;
  }

  public off<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  public removeAllListeners(event?: keyof AppEvents): this {
    this.emitter.removeAllListeners(event);
    return this;
  }
}

export const eventBus = new TypedEventBus();
