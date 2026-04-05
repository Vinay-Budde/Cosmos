import React, { useEffect, useState } from 'react';

export default function FloatingReaction({ emoji }) {
  const [visible, setVisible] = useState(true);
  const left = 30 + Math.random() * 40; // random horizontal %

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none select-none"
      style={{
        left:   `${left}%`,
        bottom: '80px',
        fontSize: '2.2rem',
        animation: 'floatUp 3s ease-out forwards',
      }}
    >
      {emoji}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)   scale(1);   opacity: 1; }
          60%  { transform: translateY(-80px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-160px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
