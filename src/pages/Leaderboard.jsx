import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { HiTrophy, HiHeart, HiChat, HiUser } from 'react-icons/hi';

const Leaderboard = () => {
  const [topMemes, setTopMemes] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('memes'); // 'memes' or 'users'

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch top memes
        const memesQuery = query(
          collection(db, 'memes'),
          orderBy('likes', 'desc'),
          limit(10)
        );
        const memesSnapshot = await getDocs(memesQuery);
        const topMemesData = memesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTopMemes(topMemesData);

        // Fetch top users based on total engagement (likes + comments)
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('totalEngagement', 'desc'),
          limit(10)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const topUsersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTopUsers(topUsersData);

      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-transparent bg-clip-text">
          MemeVerse Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top trending memes and most active users
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('memes')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'memes'
                ? 'bg-white dark:bg-gray-700 shadow-md'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Top Memes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-700 shadow-md'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Top Users
          </button>
        </div>
      </div>

      {activeTab === 'memes' ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {topMemes.map((meme, index) => (
            <motion.div
              key={meme.id}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex"
            >
              <div className="w-16 bg-gradient-to-b from-yellow-400 via-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                #{index + 1}
              </div>
              <div className="flex-1 flex items-center p-4">
                <img
                  src={meme.imageUrl}
                  alt={meme.caption}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {meme.caption}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center text-red-500">
                      <HiHeart className="w-5 h-5 mr-1" />
                      <span>{meme.likes}</span>
                    </div>
                    <div className="flex items-center text-blue-500">
                      <HiChat className="w-5 h-5 mr-1" />
                      <span>{meme.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {topUsers.map((user, index) => (
            <motion.div
              key={user.id}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex"
            >
              <div className="w-16 bg-gradient-to-b from-yellow-400 via-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                #{index + 1}
              </div>
              <div className="flex-1 flex items-center p-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <HiUser className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.displayName || 'Anonymous User'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-sm text-gray-500">
                      {user.memesPosted || 0} memes posted
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.totalEngagement || 0} total engagement
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {index === 0 && <HiTrophy className="w-6 h-6 text-yellow-500" />}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;
