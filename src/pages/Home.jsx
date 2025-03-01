import React, { useState, useEffect, useRef } from 'react';
import { HiHeart, HiOutlineHeart, HiChat, HiShare, HiUser } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { fetchMemes, fetchTemplates } from '../services/api';
import toast from 'react-hot-toast';

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
    }, 6000);

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

  const handleShare = (meme) => {
    // Copy meme URL to clipboard
    navigator.clipboard.writeText(meme.url)
      .then(() => toast.success('Meme URL copied to clipboard!'))
      .catch(() => toast.error('Failed to copy URL'));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className={`animate-spin rounded-full h-8 w-8 border-2 ${
          darkMode ? 'border-blue-400' : 'border-blue-500'
        } border-t-transparent`}></div>
      </div>
    );
  }

  // Get the 4 memes to display starting from currentMemeIndex
  const displayedMemes = memes.slice(currentMemeIndex, currentMemeIndex + 4);

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Trending Memes
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {displayedMemes.map((meme, index) => (
          <div 
            key={meme.id}
            className={`
              ${darkMode ? 'bg-gray-800' : 'bg-white'} 
              rounded-lg shadow-md overflow-hidden 
              transform transition-all duration-500 
              ${animationDirection}
              hover:scale-105
            `}
          >
            <div className="relative aspect-video">
              <img
                src={meme.url}
                alt={meme.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.target.src = 'https://via.placeholder.com/600x400?text=Failed+to+load+meme';
                }}
              />
            </div>
            
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <HiUser className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
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
                      <HiOutlineHeart className={`${
                        darkMode ? 'text-gray-400 hover:text-red-400' : 'hover:text-red-500'
                      }`} />
                    )}
                  </button>
                  <button 
                    className={`text-2xl transition-colors duration-200 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <HiChat />
                  </button>
                  <button 
                    onClick={() => handleShare(meme)}
                    className={`text-2xl transition-colors duration-200 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <HiShare />
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {meme.title}
                </p>
                <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
  );
};

export default Home;
