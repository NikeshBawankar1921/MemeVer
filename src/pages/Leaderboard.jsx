import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { HiTrophy, HiStar } from 'react-icons/hi'

const Leaderboard = () => {
  const memes = useSelector(state => state.memes.items)
  
  // Sort memes by likes
  const topMemes = [...memes]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10)

  // Create mock user rankings based on meme engagement
  const userRankings = [
    { id: 1, name: 'MemeKing', points: 1200, avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=king' },
    { id: 2, name: 'LaughMaster', points: 980, avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=master' },
    { id: 3, name: 'GiggleQueen', points: 850, avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=queen' },
    // Add more mock users here
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4"
        >
          <HiTrophy className="w-8 h-8 text-yellow-500" />
        </motion.div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Top memes and creators</p>
      </div>

      {/* Top Memes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HiStar className="w-6 h-6 text-yellow-500" />
          Top 10 Memes
        </h2>
        <div className="grid gap-4">
          {topMemes.map((meme, index) => (
            <motion.div
              key={meme.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card flex items-center gap-4 p-4"
            >
              <div className="flex-shrink-0 w-16 h-16">
                <img
                  src={meme.url}
                  alt={meme.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium truncate">{meme.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {meme.likes} likes · {meme.comments} comments
                </p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HiStar className="w-6 h-6 text-yellow-500" />
          Top Creators
        </h2>
        <div className="grid gap-4">
          {userRankings.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card flex items-center gap-4 p-4"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.points} points
                </p>
              </div>
              <div className="text-2xl">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        <p>Keep creating and sharing memes to climb the leaderboard!</p>
      </div>
    </motion.div>
  )
}

export default Leaderboard
