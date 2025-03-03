import React, { useState, useEffect, useRef } from 'react';
import { HiHeart, HiOutlineHeart, HiChat, HiShare, HiUser } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { fetchMemes, fetchTemplates } from '../services/api';
import toast from 'react-hot-toast';
import { handleShare } from '../utils/shareUtils';

const Home = () => {
  const [memes, setMemes] = useState([]);
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const darkMode = useSelector((state) => state.theme.darkMode);
  const intervalRef = useRef(null);
  const [animationDirection, setAnimationDirection] = useState('');

  const loadContent = async () => {
    try {
      setLoading(true);
      // Fetch both templates and create sample memes
      const templates = await fetchTemplates();
      const sampleMemes = templates.slice(0, 20).map(template => ({
        id: template.id,
        url: `https://api.memegen.link/images/${template.id}/Top_Text/Bottom_Text.jpg`,
        title: template.name,
        username: `meme_creator_${Math.floor(Math.random() * 1000)}`,
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 200),
        liked: false
      }));

      // Shuffle the memes
      const shuffledMemes = sampleMemes.sort(() => 0.5 - Math.random());
      
      // Set animation direction
      setAnimationDirection('animate-slide-right-to-left');
      
      // Update memes and reset index
      setMemes(shuffledMemes);
      setCurrentMemeIndex(0);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load trending memes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadContent();

    // Set up interval to refresh memes every 10 seconds
    intervalRef.current = setInterval(() => {
      setCurrentMemeIndex(prevIndex => {
        // Calculate next index, wrapping around to 0 if at the end
        const nextIndex = (prevIndex + 4) % memes.length;
        
        // Set animation direction
        setAnimationDirection('animate-slide-right-to-left');
        
        return nextIndex;
      });
    }, 10000);

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [memes.length]);

  const handleLike = (memeId) => {
    setMemes(prev =>
      prev.map(meme =>
        meme.id === memeId
          ? { 
              ...meme, 
              liked: !meme.liked,
              likes: meme.liked ? meme.likes - 1 : meme.likes + 1
            }
          : meme
      )
    );
    toast.success('Meme liked!');
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex justify-center items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 -z-10" />
        <div className="absolute inset-0 backdrop-blur-xl -z-10" />
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  // Get the 4 memes to display starting from currentMemeIndex
  const displayedMemes = memes.slice(currentMemeIndex, currentMemeIndex + 4);

  return (
    <div className="min-h-screen relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 -z-10" />
      <div className="fixed inset-0 backdrop-blur-xl -z-10" />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Glass Effect */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 dark:border-gray-700/20 shadow-xl">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Trending Memes
          </h2>
        </div>

        {/* Memes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {displayedMemes.map((meme) => (
            <div 
              key={meme.id}
              className="group relative rounded-2xl overflow-hidden bg-white/40 dark:bg-gray-800/40 
                backdrop-blur-md shadow-lg border border-white/20 dark:border-gray-700/20
                transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="relative aspect-video">
                <img
                  src={meme.url}
                  alt={meme.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=Failed+to+load+meme';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <HiUser className="text-xl text-gray-900 dark:text-white" />
                  <span className="text-sm text-gray-900 dark:text-gray-200">
                    {meme.username}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(meme.id)}
                      className="text-2xl transition-colors duration-200"
                    >
                      {meme.liked ? (
                        <HiHeart className="text-red-500" />
                      ) : (
                        <HiOutlineHeart className="text-gray-700 dark:text-gray-300 hover:text-red-500" />
                      )}
                    </button>
                    <button className="text-2xl text-gray-700 dark:text-gray-300 hover:text-violet-600">
                      <HiChat />
                    </button>
                    <button 
                      onClick={() => handleShare({
                        name: meme.title,
                        url: meme.url,
                        type: 'meme'
                      })}
                      className="text-2xl text-gray-700 dark:text-gray-300 hover:text-pink-600"
                    >
                      <HiShare />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {meme.title}
                  </p>
                  <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                    <span>{meme.likes.toLocaleString()} likes</span>
                    <span className="mx-2">•</span>
                    <span>{meme.comments.toLocaleString()} comments</span>
                    <span className="mx-2">•</span>
                    <span>{meme.shares.toLocaleString()} shares</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
