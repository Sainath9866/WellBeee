'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    
    const root = document.documentElement;
    root.classList.remove(storedTheme === 'dark' ? 'light' : 'dark');
    root.classList.add(storedTheme);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    root.classList.remove(theme);
    root.classList.add(newTheme);
    
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  // Don't render anything until client-side
  if (!mounted) {
    return <div className="w-5 h-5"></div>;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
} 