import React, { useState } from 'react'
import { HiX } from 'react-icons/hi'
import Login from './Login'
import Register from './Register'

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <HiX className="h-6 w-6" />
        </button>
        {isLogin ? (
          <Login onToggle={() => setIsLogin(false)} />
        ) : (
          <Register onToggle={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}

export default AuthModal
