import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { HiHeart, HiOutlineHeart, HiChat, HiShare, HiArrowLeft } from 'react-icons/hi'
import { toggleLike } from '../store/memesSlice'
import toast from 'react-hot-toast'

const MemeDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const meme = useSelector(state => state.memes.items.find(m => m.id === id))
  const likedMemes = useSelector(state => state.memes.likedMemes)
  
  const [comments, setComments] = useState(() => {
    const saved = localStorage.getItem(`comments_${id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (!meme) {
      navigate('/404')
    }
  }, [meme, navigate])

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const comment = {
      id: Date.now(),
      text: newComment,
      username: 'Anonymous', // In a real app, this would be the logged-in user
      timestamp: new Date().toISOString()
    }

    setComments(prev => {
      const updated = [comment, ...prev]
      localStorage.setItem(`comments_${id}`, JSON.stringify(updated))
      return updated
    })
    setNewComment('')
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: meme.name,
        url: window.location.href
      })
    } catch (error) {
      toast.error('Sharing is not supported on this device')
    }
  }

  if (!meme) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <HiArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Meme Image */}
      <div className="card">
        <img
          src={meme.url}
          alt={meme.name}
          className="w-full aspect-square object-cover"
        />
        
        {/* Actions */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(toggleLike(meme.id))}
                className="focus:outline-none"
              >
                {likedMemes.includes(meme.id) ? (
                  <HiHeart className="w-8 h-8 text-red-500" />
                ) : (
                  <HiOutlineHeart className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                )}
              </motion.button>
              <button className="focus:outline-none">
                <HiChat className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </button>
              <button onClick={handleShare} className="focus:outline-none">
                <HiShare className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {meme.likes} likes · {comments.length} comments
            </div>
          </div>

          <h2 className="text-lg font-semibold">{meme.name}</h2>
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="btn btn-primary"
          >
            Post
          </button>
        </form>

        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{comment.username}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default MemeDetails
