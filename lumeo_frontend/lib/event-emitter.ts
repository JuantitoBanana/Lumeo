/**
 * Event Emitter simple para notificaciones entre componentes
 */
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Retornar función para desuscribirse
    return () => {
      this.off(event, callback);
    };
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

export const eventEmitter = new EventEmitter();

// Eventos de la aplicación
export const APP_EVENTS = {
  CURRENCY_CHANGED: 'currency_changed',
  TRANSACTION_DELETED: 'transaction_deleted',
};
