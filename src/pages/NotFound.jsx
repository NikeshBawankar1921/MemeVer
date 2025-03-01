import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  const memeTexts = [
    "404: Meme Not Found",
    "Looks like this meme got lost in the void",
    "Even the best memes sometimes get lost",
    "This is not the meme you're looking for",
    "Error 404: Humor.exe has stopped working"
  ]

  const randomText = memeTexts[Math.floor(Math.random() * memeTexts.length)]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="text-9xl mb-8"
      >
        😅
      </motion.div>
      
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold mb-4"
      >
        {randomText}
      </motion.h1>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 dark:text-gray-400 mb-8"
      >
        Don't worry, there are plenty of other memes to explore!
      </motion.p>
      
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="btn btn-primary"
      >
        Back to Meme Heaven
      </motion.button>
    </motion.div>
  )
}

export default NotFound
