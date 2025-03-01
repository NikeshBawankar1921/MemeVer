import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster position="bottom-center" />
    </Provider>
  </React.StrictMode>
)
