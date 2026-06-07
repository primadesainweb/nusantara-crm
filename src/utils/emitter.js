/**
 * Simple Event Emitter
 */
export class EventEmitter {
  constructor() {
    this._events = {}
  }

  on(event, fn) {
    (this._events[event] ??= []).push(fn)
    return () => this.off(event, fn)
  }

  off(event, fn) {
    if (!fn) {
      delete this._events[event]
    } else {
      this._events[event] = (this._events[event] || []).filter(f => f !== fn)
    }
  }

  emit(event, ...args) {
    ;(this._events[event] || []).forEach(fn => fn(...args))
  }

  once(event, fn) {
    const off = this.on(event, (...args) => { fn(...args); off() })
  }
}
