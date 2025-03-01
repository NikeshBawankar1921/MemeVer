import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './themeSlice'

const initialState = {
  memes: [],
  loading: false,
  error: null
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state
  }
}

export const store = configureStore({
  reducer: {
    app: reducer,
    theme: themeReducer
  }
})
