import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="button is-small is-rounded is-warning is-light no-print"
      title="切換深淺色模式"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
    >
      {theme === 'light' ? '🌙 深色模式' : '☀️ 淺色模式'}
    </button>
  );
}
