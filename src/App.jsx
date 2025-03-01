import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { HiHome, HiSearch, HiTemplate, HiUser, HiSun, HiMoon, HiPlus, HiUpload } from 'react-icons/hi'
import { useSelector, useDispatch } from 'react-redux'
import { toggleDarkMode } from './store/themeSlice'
import Explorer from './pages/Explorer'
import Templates from './pages/Templates'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import UploadPage from './pages/UploadPage'

function App() {
  const dispatch = useDispatch()
  const darkMode = useSelector((state) => state.theme.darkMode)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-sky-400 to-sky-200 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900">
        {/* Top Navigation */}
        <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-400 to-blue-500 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900  border-b border-gray-200 dark:border-gray-700 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-14">
              <Link to="/" className="text-xl font-bold text-white dark:text-blue-400">
                MemeVerse
              </Link>
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="p-2 rounded-lg transition-colors text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <HiSun size={24} /> : <HiMoon size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explorer />} />
              <Route path="/uploadpage" element={<UploadPage />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth/login" />} />
              <Route path="/auth/login" element={!user ? <Login /> : <Navigate to="/profile" />} />
              <Route path="/auth/register" element={!user ? <Register /> : <Navigate to="/profile" />} />
              
            </Routes>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-800 to-blue-900 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-around items-center h-16">
              <Link 
                to="/" 
                className="flex flex-col items-center text-white hover:text-gray-900 dark:text-gray-400 dark:hover:text-blue-500"
              >
                <HiHome className="h-6 w-6" />
                <span className="text-xs mt-1">Home</span>
              </Link>
              <Link 
                to="/explore" 
                className="flex flex-col items-center text-white hover:text-gray-900 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <HiSearch className="h-6 w-6" />
                <span className="text-xs mt-1">Explore</span>
              </Link>
              <Link 
                to="/uploadpage" 
                className="flex flex-col items-center text-white hover:text-gray-900 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <HiUpload className="h-6 w-6" />
                <span className="text-xs mt-1">Upload</span>
              </Link> 
              <Link 
                to="/templates" 
                className="flex flex-col items-center text-white hover:text-gray-900 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <HiTemplate className="h-6 w-6" />
                <span className="text-xs mt-1">Templates</span>
              </Link>
              <Link 
                to="/profile" 
                className="flex flex-col items-center text-white hover:text-gray-900 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <HiUser className="h-6 w-6" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </Router>
  )
}

export default App
