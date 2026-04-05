import { useEffect, useState } from 'react';
import { toastEmitter } from '../utils/toastEmitter';

export default function ToastManager() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timeout;
    const handleToast = (msg) => {
      setToast(msg);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setToast(null);
      }, 2500);
    };
    
    toastEmitter.on(handleToast);
    return () => toastEmitter.off(handleToast);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-[60px] left-1/2 -translate-x-1/2 bg-black/80 rounded-full px-5 py-2 text-white text-xs z-[9999] transition-opacity duration-300 pointer-events-none">
      {toast}
    </div>
  );
}
