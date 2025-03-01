import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'))

// Render app with providers
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 4000,
          },
        }}
      />
    </Provider>
  </React.StrictMode>
)
