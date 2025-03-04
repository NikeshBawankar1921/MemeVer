import React, { useState, useEffect } from 'react';
import { HiDownload, HiShare, HiHeart } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { handleShare } from '../utils/shareUtils';
import { getLikedMemes } from '../utils/likeUtils';
import { auth, db } from '../firebase/config';
import { doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LikedMemes = () => {
  const [likedMemes, setLikedMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLikedMemes = async () => {
      try {
        setLoading(true);
        console.log('Fetching liked memes...');
        const memes = await getLikedMemes();
        console.log('Fetched memes:', memes);
        setLikedMemes(memes);
      } catch (error) {
        console.error('Error fetching liked memes:', error);
        toast.error('Failed to load liked memes');
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchLikedMemes();
    } else {
      setLoading(false);
      navigate('/auth/login');
      toast.error('Please login to view your liked memes');
    }
  }, [navigate]);

  const handleUnlike = async (meme) => {
    if (!auth.currentUser) {
      toast.error('Please login to manage your liked memes');
      navigate('/auth/login');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const likedMemes = userData.likedMemes || [];
        const existingMeme = likedMemes.find(m => m.id === meme.id);
        
        if (existingMeme) {
          // Remove from liked memes
          await updateDoc(userRef, {
            likedMemes: arrayRemove(existingMeme)
          });
          
          // Update local state
          setLikedMemes(prevMemes => prevMemes.filter(m => m.id !== meme.id));
          
          toast.success('Removed from your liked memes');
        }
      }
    } catch (error) {
      console.error('Error unliking meme:', error);
      toast.error('Failed to unlike meme');
    }
  };

  const handleDownload = async (meme) => {
    try {
      const response = await fetch(meme.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${meme.name.replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Meme downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download meme');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (likedMemes.length === 0) {
    return (
      <div className="text-center py-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl">
        <p className="text-gray-600 dark:text-gray-400">
          No liked memes yet. Start exploring and like some memes!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 
        bg-clip-text text-transparent mb-4">
        Your Liked Memes
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {likedMemes.map((meme) => (
          <div
            key={meme.id}
            className="group relative rounded-xl overflow-hidden bg-white/40 dark:bg-gray-800/40 
              backdrop-blur-md shadow-lg border border-white/20 dark:border-gray-700/20
              transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <img
              src={meme.url}
              alt={meme.name}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white truncate">
                {meme.name}
              </h3>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleUnlike(meme)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                  title="Unlike this meme"
                >
                  <HiHeart className="w-5 h-5" />
                  <span className="text-sm">Unlike</span>
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDownload(meme)}
                    className="text-xl text-violet-500 hover:text-violet-600 transition-colors"
                  >
                    <HiDownload />
                  </button>
                  <button
                    onClick={() => handleShare({
                      name: meme.name,
                      url: meme.url,
                      type: 'meme'
                    })}
                    className="text-xl text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    <HiShare />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LikedMemes;