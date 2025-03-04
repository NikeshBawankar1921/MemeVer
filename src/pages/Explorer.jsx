import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiSearch, HiOutlineHeart, HiHeart, HiDownload, HiShare, HiFilter, HiSortAscending } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FaHeart, FaRegHeart, FaDownload } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;

const CATEGORIES = [
  { id: 'all', label: 'All Memes' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' },
  { id: 'classic', label: 'Classic' },
  { id: 'favorites', label: 'My Favorites' }
];

const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest', field: 'createdAt', direction: 'desc' },
  { id: 'oldest', label: 'Oldest', field: 'createdAt', direction: 'asc' },
  { id: 'popular', label: 'Popular', field: 'likes', direction: 'desc' },
  { id: 'random', label: 'Random', field: 'random', direction: 'asc' }
];

const Explorer = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0]);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const observer = useRef();
  const user = auth.currentUser;
  const darkMode = useSelector((state) => state.theme.darkMode);
  const [allMemegenMemes, setAllMemegenMemes] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [likedMemes, setLikedMemes] = useState([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      fetchMemes(true, searchTerm);
    }, 500),
    [activeCategory, activeSort]
  );

  const fetchMemegenMemes = async () => {
    try {
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
        data.forEach((meme, index) => {
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
        const transformedMemes = Array.from(uniqueMemeTemplates.values());
        setAllMemegenMemes(transformedMemes);
      } else {
        throw new Error('Invalid response format from Memegen.link API');
      }
    } catch (error) {
      console.error('Error fetching memes:', error);
      toast.error('Failed to load memes from Memegen.link');
    }
  };

  const fetchMemes = async (isNewSearch = false, searchTerm = searchQuery) => {
    try {
      setLoading(true);
      
      if (activeCategory === 'favorites' && !user) {
        toast.error('Please login to view your favorites');
        setMemes([]);
        setLoading(false);
        return;
      }
      
      // Handle favorites separately (fetch from user's liked memes in Firestore)
      if (activeCategory === 'favorites' && user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const likedMemes = userData.likedMemes || [];
          
          // Apply search filter if needed
          let filteredMemes = likedMemes;
          if (searchTerm) {
            filteredMemes = likedMemes.filter(meme => 
              meme.caption && meme.caption.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          // Apply sorting
          filteredMemes.sort((a, b) => {
            const field = activeSort.field;
            if (field === 'createdAt') {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return activeSort.direction === 'desc' ? dateB - dateA : dateA - dateB;
            } else if (field === 'random') {
              return Math.random() - 0.5;
            }
            return activeSort.direction === 'desc' 
              ? (b[field] || 0) - (a[field] || 0) 
              : (a[field] || 0) - (b[field] || 0);
          });

          // Find the original memes to get their current likes count
          const memesWithCurrentLikes = filteredMemes.map(meme => {
            const originalMeme = allMemegenMemes.find(m => m.id === meme.id);
            return {
              ...meme,
              liked: true,
              likes: originalMeme ? originalMeme.likes : (meme.likes || 0)
            };
          });
          
          setMemes(memesWithCurrentLikes);
          setHasMore(false);
        } else {
          setMemes([]);
        }
        setLoading(false);
        return;
      }
      
      // For other categories, use the memegen.link API memes
      if (isNewSearch) {
        setPageNum(1);
      }
      
      // If we haven't loaded memegen.link memes yet or they're empty, don't proceed
      if (allMemegenMemes.length === 0) {
        setLoading(false);
        return;
      }
      
      // Filter memes based on search and category
      let filteredMemes = [...allMemegenMemes];
      
      if (searchTerm) {
        filteredMemes = filteredMemes.filter(meme => 
          meme.caption && meme.caption.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply category filters
      if (activeCategory === 'trending') {
        filteredMemes = filteredMemes.filter(meme => meme.likes >= 30);
      } else if (activeCategory === 'new') {
        // For demo purposes, consider 1/3 of memes as "new" (based on the random created date)
        filteredMemes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        filteredMemes = filteredMemes.slice(0, Math.floor(filteredMemes.length / 3));
      } else if (activeCategory === 'classic') {
        // For demo purposes, consider the oldest 2/3 of memes as "classic"
        filteredMemes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        filteredMemes = filteredMemes.slice(0, Math.floor(filteredMemes.length * 2 / 3));
      }
      
      // Apply sorting
      filteredMemes.sort((a, b) => {
        const field = activeSort.field;
        if (field === 'createdAt') {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return activeSort.direction === 'desc' ? dateB - dateA : dateA - dateB;
        } else if (field === 'random') {
          return Math.random() - 0.5;
        }
        return activeSort.direction === 'desc' 
          ? (b[field] || 0) - (a[field] || 0) 
          : (a[field] || 0) - (b[field] || 0);
      });
      
      // Get the current page of memes for pagination
      const start = isNewSearch ? 0 : (pageNum - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pagedMemes = filteredMemes.slice(start, end);
      
      // Check if user has liked any of these memes
      let memesWithLikedStatus = [...pagedMemes];
      
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const likedMemeIds = userData.likedMemes?.map(meme => meme.id) || [];
            
            memesWithLikedStatus = pagedMemes.map(meme => ({
              ...meme,
              liked: likedMemeIds.includes(meme.id)
            }));
          }
        } catch (error) {
          console.error('Error checking liked memes:', error);
        }
      }
      
      if (isNewSearch) {
        setMemes(memesWithLikedStatus);
      } else {
        setMemes(prev => [...prev, ...memesWithLikedStatus]);
      }
      
      setHasMore(end < filteredMemes.length);
      
      if (!isNewSearch) {
        setPageNum(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error processing memes:', error);
      toast.error('Failed to load memes');
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll setup
  const lastMemeRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMemes(false);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setMemes([]);
    setPageNum(1);
    fetchMemes(true, searchQuery);
  };

  // Handle sort change
  const handleSortChange = (sort) => {
    setActiveSort(sort);
    setMemes([]);
    setPageNum(1);
    fetchMemes(true, searchQuery);
  };

  // Handle download
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
      toast.success('Meme downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download meme');
    }
  };

  // Fetch user's liked memes
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

  useEffect(() => {
    if (user) {
      fetchLikedMemes();
    }
  }, [user]);

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
        setMemes((prevMemes) =>
          prevMemes.map((m) =>
            m.id === meme.id ? { ...m, likes: Math.max(0, (m.likes || 0) - 1), liked: false } : m
          )
        );

        // If we're in favorites view, remove the meme from the list
        if (activeCategory === 'favorites') {
          setMemes((prevMemes) => prevMemes.filter((m) => m.id !== meme.id));
        }
      } else {
        // Add to liked memes
        const memeToAdd = {
          id: meme.id,
          imageUrl: meme.imageUrl,
          caption: meme.caption,
          createdAt: new Date().toISOString(),
          template: meme.template,
          url: meme.imageUrl,
          likes: meme.likes || 0
        };

        await updateDoc(userRef, {
          likedMemes: arrayUnion(memeToAdd)
        });
        
        // Update local state
        setMemes((prevMemes) =>
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

  // Initial fetch of memegen.link memes
  useEffect(() => {
    fetchMemegenMemes();
  }, []);

  // Fetch memes whenever memegen.link memes are loaded or filters change
  useEffect(() => {
    if (allMemegenMemes.length > 0) {
      fetchMemes(true);
    }
  }, [allMemegenMemes, activeCategory, activeSort]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search and Filters Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search memes..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700"
          >
            <HiFilter className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${activeCategory === category.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => handleSortChange(sort)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2
                      ${activeSort.id === sort.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                  >
                    <HiSortAscending className={activeSort.id === sort.id ? 'text-white' : 'text-gray-500'} />
                    {sort.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Memes Grid */}
      {memes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {memes.map((meme, index) => (
            <motion.div
              key={meme.id}
              ref={index === memes.length - 1 ? lastMemeRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
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
                  <div className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white p-2 text-center">
                    <p className="truncate">{meme.caption}</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Memegen Template
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(meme.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => handleLike(meme)}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-colors"
                  >
                    {meme.liked || likedMemes.some(m => m.id === meme.id) ? (
                      <FaHeart className="w-5 h-5 text-red-500" />
                    ) : (
                      <FaRegHeart className="w-5 h-5" />
                    )}
                    <span>{meme.likes || 0}</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(meme)}
                      className="p-1 text-gray-500 hover:text-blue-500"
                    >
                      <FaDownload className="w-5 h-5" />
                    </button>
                    <a
                      href={`/create?template=${encodeURIComponent(meme.template)}`}
                      className="p-1 text-gray-500 hover:text-green-500"
                    >
                      <HiShare className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-lg">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {activeCategory === 'favorites' 
                ? 'No liked memes yet' 
                : searchQuery 
                  ? 'No memes found matching your search' 
                  : allMemegenMemes.length === 0
                    ? 'Error loading memes from Memegen.link API'
                    : 'No memes available in this category'}
            </p>
          </div>
        )
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
};

export default Explorer;
