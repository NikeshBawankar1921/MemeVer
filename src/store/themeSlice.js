import { createSlice } from '@reduxjs/toolkit'

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return savedTheme === 'dark'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const initialState = {
  darkMode: getInitialTheme()
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      localStorage.setItem('theme', state.darkMode ? 'dark' : 'light')
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
      localStorage.setItem('theme', action.payload ? 'dark' : 'light')
    }
  }
})

export const { toggleDarkMode, setDarkMode } = themeSlice.actions
export default themeSlice.reducer
