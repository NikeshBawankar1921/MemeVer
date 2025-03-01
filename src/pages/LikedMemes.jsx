import React, { useState, useEffect } from 'react';
import { HiHeart, HiUpload } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

const LikedMemes = () => {
  const [activeTab, setActiveTab] = useState('likes');
  const [allMemes, setAllMemes] = useState([]);
  const [likedMemes, setLikedMemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMemes = async () => {
      try {
        const response = await fetch('https://api.imgflip.com/get_memes');
        if (!response.ok) throw new Error('Failed to fetch memes');
        
        const data = await response.json();
        if (data.success) {
          setAllMemes(data.data.memes);
          // Get liked memes from localStorage after fetching all memes
          const savedFavorites = localStorage.getItem('favoriteMemes');
          if (savedFavorites) {
            const favoriteIds = JSON.parse(savedFavorites);
            const liked = data.data.memes.filter(meme => favoriteIds.includes(meme.id));
            setLikedMemes(liked);
          }
        } else {
          throw new Error('Failed to get memes from API');
        }
      } catch (error) {
        console.error('Error fetching memes:', error);
        toast.error('Failed to load memes');
      } finally {
        setLoading(false);
      }
    };

    fetchAllMemes();
  }, []);

  const renderMemes = (memes) => {
    if (loading) {
      return <div className="text-center py-10 text-gray-500">Loading memes...</div>;
    }

    if (memes.length === 0) {
      return <div className="text-center py-10 text-gray-500">No memes found</div>;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {memes.map(meme => (
          <div key={meme.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={meme.url} 
                alt={meme.name || 'Meme'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                }}
              />
            </div>
            <div className="p-2">
              <h3 className="text-sm font-semibold truncate">{meme.name || 'Untitled Meme'}</h3>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="flex space-x-4 mb-4 mt-8">
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex items-center px-4 py-2 rounded ${
            activeTab === 'likes'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <HiHeart className="mr-2" />
          Liked Memes ({likedMemes.length})
        </button>
      </div>

      {activeTab === 'likes' && renderMemes(likedMemes)}
    </div>
  );
};

export default LikedMemes;