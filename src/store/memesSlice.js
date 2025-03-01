import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchMemes = createAsyncThunk(
  'memes/fetchMemes',
  async ({ page = 1, category = 'trending' }) => {
    const response = await axios.get(`https://api.memegen.link/images?page=${page}`)
    return response.data.map(meme => ({
      ...meme,
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      category
    }))
  }
)

const memesSlice = createSlice({
  name: 'memes',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    page: 1,
    hasMore: true,
    likedMemes: JSON.parse(localStorage.getItem('likedMemes') || '[]'),
    category: 'trending'
  },
  reducers: {
    toggleLike: (state, action) => {
      const memeId = action.payload
      const likedIndex = state.likedMemes.indexOf(memeId)
      
      if (likedIndex === -1) {
        state.likedMemes.push(memeId)
      } else {
        state.likedMemes.splice(likedIndex, 1)
      }
      
      localStorage.setItem('likedMemes', JSON.stringify(state.likedMemes))
    },
    setCategory: (state, action) => {
      state.category = action.payload
      state.items = []
      state.page = 1
      state.hasMore = true
    },
    clearMemes: (state) => {
      state.items = []
      state.page = 1
      state.hasMore = true
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMemes.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMemes.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = [...state.items, ...action.payload]
        state.page += 1
        state.hasMore = action.payload.length > 0
      })
      .addCase(fetchMemes.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

export const { toggleLike, setCategory, clearMemes } = memesSlice.actions
export default memesSlice.reducer
