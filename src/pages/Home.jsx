import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiHeart, HiOutlineHeart, HiShare, HiDownload } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleShare } from '../utils/shareUtils';

const Home = () => {
  const [trendingMemes, setTrendingMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const darkMode = useSelector((state) => state.theme.darkMode);
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [likedMemes, setLikedMemes] = useState([]);

  // Fetch trending memes from memegen.link API
  const fetchTrendingMemes = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_MEME_API_BASE_URL || 'https://api.memegen.link';
      const response = await fetch(`${apiUrl}/images`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch memes from Memegen.link API');
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Create a Map to store unique memes by template
        const uniqueMemeTemplates = new Map();
        
        // Process each meme from the API
        data.forEach((meme) => {
          // Extract the template ID from the template URL
          const templateParts = meme.template.split('/');
          const templateId = templateParts[templateParts.length - 1];
          
          // Only add this meme if we haven't seen this template before
          if (!uniqueMemeTemplates.has(templateId)) {
            // Generate a random date within the last 90 days
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90));
            
            uniqueMemeTemplates.set(templateId, {
              id: templateId,
              imageUrl: meme.url,
              caption: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              template: meme.template,
              createdAt: randomDate.toISOString(),
              likes: Math.floor(Math.random() * 100),
              liked: false
            });
          }
        });
        
        // Convert the Map values to an array
        const allMemes = Array.from(uniqueMemeTemplates.values());
        
        // Filter for trending memes (likes >= 30)
        const trending = allMemes.filter(meme => meme.likes >= 30);
        
        // Sort by likes (highest first)
        trending.sort((a, b) => b.likes - a.likes);
        
        // Take at most 12 trending memes
        setTrendingMemes(trending.slice(0, 12));
        
        // Check if user has liked any of these memes
        if (auth.currentUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const likedMemeIds = userData.likedMemes?.map(meme => meme.id) || [];
              
              setTrendingMemes(prev => 
                prev.map(meme => ({
                  ...meme,
                  liked: likedMemeIds.includes(meme.id)
                }))
              );
            }
          } catch (error) {
            console.error('Error checking liked memes:', error);
          }
        }
      } else {
        throw new Error('Invalid response format from Memegen.link API');
      }
    } catch (error) {
      console.error('Error fetching memes:', error);
      toast.error('Failed to load trending memes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingMemes();
  }, []);

  const handleLike = async (meme) => {
    if (!user) {
      toast.error('Please login to like memes');
      navigate('/auth/login');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast.error('User document not found');
        return;
      }

      const userData = userDoc.data();
      const likedMemes = userData.likedMemes || [];
      const isLiked = likedMemes.some((m) => m.id === meme.id);

      if (isLiked) {
        // Remove from liked memes
        await updateDoc(userRef, {
          likedMemes: likedMemes.filter((m) => m.id !== meme.id),
        });
        
        // Update local state
        setTrendingMemes((prevMemes) =>
          prevMemes.map((m) =>
            m.id === meme.id ? { ...m, likes: Math.max(0, (m.likes || 0) - 1), liked: false } : m
          )
        );
      } else {
        // Add to liked memes
        const memeToAdd = {
          id: meme.id,
          imageUrl: meme.imageUrl,
          caption: meme.caption,
          createdAt: new Date().toISOString(),
          template: meme.template,
          url: meme.imageUrl, // Adding url field for compatibility
          likes: meme.likes || 0 // Add the likes count
        };

        await updateDoc(userRef, {
          likedMemes: arrayUnion(memeToAdd)
        });
        
        // Update local state
        setTrendingMemes((prevMemes) =>
          prevMemes.map((m) =>
            m.id === meme.id ? { ...m, likes: (m.likes || 0) + 1, liked: true } : m
          )
        );
      }

      // Update liked memes state
      const updatedUserDoc = await getDoc(userRef);
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data();
        setLikedMemes(updatedUserData.likedMemes || []);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  // Add this useEffect to fetch liked memes when component mounts
  useEffect(() => {
    const fetchLikedMemes = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLikedMemes(userData.likedMemes || []);
        }
      } catch (error) {
        console.error('Error fetching liked memes:', error);
      }
    };

    fetchLikedMemes();
  }, [user]);

  const handleDownload = async (meme) => {
    try {
      const response = await fetch(meme.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${meme.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Meme downloaded successfully!');
    } catch (error) {
      console.error('Error downloading meme:', error);
      toast.error('Failed to download meme');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Welcome to <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">MemeVerse</span>
      </h1>
      
      <h2 className="text-2xl font-semibold mb-8 text-center">Trending Memes</h2>
      
      {trendingMemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingMemes.map((meme) => (
            <div 
              key={meme.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="relative aspect-square">
                <img 
                  src={meme.imageUrl} 
                  alt={meme.caption || 'Meme'} 
                  className="w-full h-full object-contain bg-gray-100 dark:bg-gray-900"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available';
                  }}
                />
                {meme.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center">
                    <p className="truncate">{meme.caption}</p>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Memegen Template
                  </div>
                  <div className="text-xs text-gray-400">
                    {meme.createdAt ? new Date(meme.createdAt).toLocaleDateString() : 'Unknown date'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => handleLike(meme)}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-colors"
                  >
                    {meme.liked ? (
                      <HiHeart className="w-6 h-6 text-red-500" />
                    ) : (
                      <HiOutlineHeart className="w-6 h-6" />
                    )}
                    <span>{meme.likes || 0}</span>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(meme)}
                      className="p-1 hover:text-blue-500 transition-colors"
                    >
                      <HiDownload className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleShare(meme)}
                      className="p-1 hover:text-green-500 transition-colors"
                    >
                      <HiShare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 dark:text-gray-400">No trending memes found. Check back later!</p>
            <Link to="/explore" className="mt-4 inline-block px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
              Explore All Memes
            </Link>
          </div>
        )
      )}
      
      {loading && (
        <div className="flex justify-center mt-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
        >
          Explore All Memes
        </button>
      </div>
    </div>
  );
};

export default Home;
