import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';

export default function TimeSince({ date, prefix = '', className = '' }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!date) return;

    const update_time = () => {
      // Replace common phrases for a cleaner look
      let formatted = formatDistanceToNow(new Date(date));
      formatted = formatted.replace('about ', '').replace('less than a minute', '1m');
      setTimeAgo(formatted);
    };

    update_time();
    const interval = setInterval(update_time, 30000); // update every 30 seconds

    return () => clearInterval(interval);
  }, [date]);

  if (!date) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-slate-500 font-mono ${className}`}>
      <Clock className="w-3 h-3" />
      <span>{prefix}{timeAgo}</span>
    </div>
  );
}