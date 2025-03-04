import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiMoon, HiSun } from 'react-icons/hi';
import { toggleDarkMode } from '../store/themeSlice';

const DarkModeToggle = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state) => state.theme.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <button
      onClick={() => dispatch(toggleDarkMode())}
      className="relative inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-200
                 hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-10 h-6 transition duration-200 ease-linear rounded-full">
        <div
          className={`absolute w-6 h-6 transition duration-200 ease-linear transform 
                     ${darkMode ? 'translate-x-4' : 'translate-x-0'}
                     rounded-full shadow-md
                     ${darkMode ? 'bg-indigo-500' : 'bg-yellow-500'}`}
        >
          {darkMode ? (
            <HiMoon className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          ) : (
            <HiSun className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>
      </div>
    </button>
  );
};

export default DarkModeToggle; 