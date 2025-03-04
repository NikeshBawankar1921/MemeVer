import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { toast } from 'react-hot-toast'
import { HiHeart, HiOutlineHeart, HiChat, HiShare, HiArrowLeft, HiDownload, HiPencilAlt } from 'react-icons/hi'
import { FaFacebook, FaTwitter, FaWhatsapp, FaLink } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const MemeDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [meme, setMeme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const user = auth.currentUser

  useEffect(() => {
    const fetchMeme = async () => {
      try {
        const memeDoc = await getDoc(doc(db, 'memes', id))
        if (memeDoc.exists()) {
          setMeme({ id: memeDoc.id, ...memeDoc.data() })
          
          // Check if this meme is liked by the current user
          if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              const likedMemes = userData.likedMemes || []
              setIsLiked(likedMemes.some(meme => meme.id === id))
            }
          }
        } else {
          toast.error('Meme not found')
          navigate('/')
        }
      } catch (error) {
        console.error('Error fetching meme:', error)
        toast.error('Error loading meme')
      } finally {
        setLoading(false)
      }
    }

    fetchMeme()
  }, [id, navigate, user])

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like memes')
      return
    }

    try {
      const memeRef = doc(db, 'memes', id)
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      const newLikeStatus = !isLiked
      
      // Prepare meme data to save
      const memeData = {
        id: meme.id,
        imageUrl: meme.imageUrl,
        caption: meme.caption,
        createdAt: meme.createdAt
      }
      
      // Update user's liked memes in Firestore
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const likedMemes = userData.likedMemes || []
        const existingIndex = likedMemes.findIndex(m => m.id === id)
        
        if (newLikeStatus && existingIndex === -1) {
          // Add to liked memes
          await updateDoc(userRef, {
            likedMemes: arrayUnion(memeData)
          })
        } else if (!newLikeStatus && existingIndex !== -1) {
          // Remove from liked memes - need to remove the specific object
          await updateDoc(userRef, {
            likedMemes: arrayRemove(likedMemes[existingIndex])
          })
        }
      } else {
        // Create user doc if it doesn't exist
        await updateDoc(userRef, {
          likedMemes: newLikeStatus ? [memeData] : []
        })
      }
      
      // Update meme likes count
      await updateDoc(memeRef, {
        likes: newLikeStatus ? (meme.likes || 0) + 1 : Math.max((meme.likes || 0) - 1, 0)
      })
      
      // Update local state
      setIsLiked(newLikeStatus)
      setMeme(prev => ({
        ...prev,
        likes: newLikeStatus ? (prev.likes || 0) + 1 : Math.max((prev.likes || 0) - 1, 0)
      }))

      toast.success(newLikeStatus ? 'Added to your liked memes' : 'Removed from your liked memes')
    } catch (error) {
      console.error('Error updating like:', error)
      toast.error('Failed to update like')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to comment')
      return
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      const memeRef = doc(db, 'memes', id)
      const newComment = {
        id: Date.now().toString(),
        text: comment,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        createdAt: new Date().toISOString()
      }

      await updateDoc(memeRef, {
        comments: arrayUnion(newComment)
      })

      setMeme(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }))
      setComment('')
      toast.success('Comment added!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const handleShare = async (platform) => {
    const url = window.location.href
    const title = `Check out this meme on MemeVerse!`

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    }

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    } else {
      window.open(shareUrls[platform], '_blank')
    }
    setShowShareMenu(false)
  }

  const handleDownload = async () => {
    if (!meme) return
    
    try {
      const response = await fetch(meme.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meme-${id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Meme downloaded successfully!')
    } catch (error) {
      console.error('Error downloading meme:', error)
      toast.error('Failed to download meme')
    }
  }

  const handleEditMeme = () => {
    navigate(`/edit-meme/${id}`)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!meme) {
    return <div className="text-center">Meme not found</div>
  }

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
          src={meme.imageUrl}
          alt={meme.caption || 'Meme'}
          className="w-full aspect-square object-cover"
        />
        
        {/* Actions */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className="focus:outline-none"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLiked ? 'liked' : 'unliked'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isLiked ? (
                      <HiHeart className="w-8 h-8 text-red-500" />
                    ) : (
                      <HiOutlineHeart className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              <button className="focus:outline-none">
                <HiChat className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="focus:outline-none"
              >
                <HiShare className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {meme.likes} likes · {meme.comments?.length || 0} comments
            </div>
          </div>

          <h2 className="text-lg font-semibold">{meme.caption || 'Meme'}</h2>
        </div>
      </div>

      {/* Share Menu */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center space-x-4"
          >
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <FaFacebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600"
            >
              <FaTwitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
            >
              <FaWhatsapp className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="p-2 rounded-full bg-gray-500 text-white hover:bg-gray-600"
            >
              <FaLink className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Section */}
      <div className="space-y-4">
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            className="btn btn-primary"
          >
            Post
          </button>
        </form>

        <AnimatePresence>
          {meme.comments?.map((comment) => (
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
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <HiDownload className="w-6 h-6" />
          <span>Download</span>
        </button>
        
        <button
          onClick={handleEditMeme}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <HiPencilAlt className="w-6 h-6" />
          <span>Edit</span>
        </button>
      </div>
    </motion.div>
  )
}

export default MemeDetails
