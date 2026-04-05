export const toastEmitter = {
  listeners: [],
  on(fn) { this.listeners.push(fn); },
  off(fn) { this.listeners = this.listeners.filter(f => f !== fn); },
  emit(message) { this.listeners.forEach(fn => fn(message)); }
};

export const showToast = (msg) => toastEmitter.emit(msg);
