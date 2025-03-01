import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiMoon, HiSun } from 'react-icons/hi'

const Navbar = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            MemeVerse
          </motion.h1>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <HiSun className="w-6 h-6 text-pink-500" />
            ) : (
              <HiMoon className="w-6 h-6 text-gray-500" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
