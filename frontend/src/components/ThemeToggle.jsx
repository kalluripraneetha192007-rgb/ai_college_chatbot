import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const [isNight, setIsNight] = useState(() => localStorage.getItem('college-chat-theme') === 'night');

  useEffect(() => {
    document.documentElement.classList.toggle('night', isNight);
    localStorage.setItem('college-chat-theme', isNight ? 'night' : 'light');
  }, [isNight]);

  return (
    <button
      type="button"
      onClick={() => setIsNight((current) => !current)}
      className="theme-toggle fixed right-4 top-4 z-50 rounded-full border border-slate-200 bg-white p-3 text-slate-700 shadow-md transition hover:bg-slate-100"
      aria-label={isNight ? 'Switch to light mode' : 'Switch to night mode'}
      title={isNight ? 'Switch to light mode' : 'Switch to night mode'}
    >
      {isNight ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
