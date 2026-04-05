export const keys = {};

export function initializeKeyboard() {
  const downHandler = (e) => { keys[e.key] = true; };
  const upHandler = (e) => { keys[e.key] = false; };
  
  window.addEventListener('keydown', downHandler);
  window.addEventListener('keyup', upHandler);
  
  return () => {
    window.removeEventListener('keydown', downHandler);
    window.removeEventListener('keyup', upHandler);
  };
}
