import React, { useState, useEffect } from 'react';

interface ElapsedTimeProps {
  startTime: Date | null;
}

export const ElapsedTime: React.FC<ElapsedTimeProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className="font-mono text-sm">
      {hours > 0 && `${hours}:`}{formatNumber(minutes)}:{formatNumber(seconds)}
    </span>
  );
};
