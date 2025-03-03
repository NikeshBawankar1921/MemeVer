import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { HiSearch, HiOutlineHeart, HiHeart, HiDownload, HiShare } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { handleShare } from '../utils/shareUtils';

const ITEMS_PER_PAGE = 20; // Increased items per page

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Memes' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' }
];

const Explorer = () => {
  const [allMemes, setAllMemes] = useState([]);
  const [displayedMemes, setDisplayedMemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);
  const darkMode = useSelector((state) => state.theme.darkMode);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteMemes');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    fetchMemes();
  }, []);

  useEffect(() => {
    setDisplayedMemes([]);
    setPage(1);
    handleFilterAndSearch(false);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Debug logging
      console.log('Scroll position:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        hasMore,
        loading,
        threshold: scrollHeight - clientHeight - 100
      });

      // Check if we're near bottom (within 100px)
      if (!loading && hasMore && scrollTop + clientHeight >= scrollHeight - 100) {
        console.log('Loading more memes...');
        setPage(prevPage => prevPage + 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) {
      handleFilterAndSearch(true); // true means append mode
    } else {
      handleFilterAndSearch(false); // false means replace mode
    }
  }, [page]);

  const fetchMemes = async () => {
    try {
      setLoading(true);
      // Fetch from multiple sources for more content
      const sources = [
        'https://api.imgflip.com/get_memes',
        'https://api.memegen.link/templates'
      ];

      const responses = await Promise.all(
        sources.map(url => fetch(url).then(res => res.json()))
      );

      // Combine and format memes from different sources
      let combinedMemes = [];

      // Process ImgFlip memes
      if (responses[0].success) {
        combinedMemes.push(...responses[0].data.memes.map(meme => ({
          id: `imgflip-${meme.id}`,
          url: meme.url,
          name: meme.name,
          width: meme.width,
          height: meme.height,
          isTrending: Math.random() > 0.7,
          isNew: Math.random() > 0.8,
          source: 'imgflip'
        })));
      }

      // Process Memegen memes
      if (responses[1]) {
        combinedMemes.push(...responses[1].map(meme => ({
          id: `memegen-${meme.id}`,
          url: meme.blank,
          name: meme.name,
          width: 500,
          height: 500,
          isTrending: Math.random() > 0.7,
          isNew: Math.random() > 0.8,
          source: 'memegen'
        })));
      }

      // Shuffle the combined memes
      combinedMemes = combinedMemes.sort(() => Math.random() - 0.5);
      setAllMemes(combinedMemes);
      setHasMore(combinedMemes.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching memes:', error);
      toast.error('Failed to load memes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterAndSearch = (append = false) => {
    let filteredMemes = [...allMemes];

    // Apply search filter
    if (searchQuery) {
      filteredMemes = filteredMemes.filter(meme => 
        meme.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'favorites':
        filteredMemes = filteredMemes.filter(meme => favorites.includes(meme.id));
        break;
      case 'trending':
        filteredMemes = filteredMemes.filter(meme => meme.isTrending);
        break;
      case 'new':
        filteredMemes = filteredMemes.filter(meme => meme.isNew);
        break;
      default:
        break;
    }

    // Pagination
    const startIndex = append ? displayedMemes.length : 0;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newMemes = filteredMemes.slice(startIndex, endIndex);
    
    setHasMore(endIndex < filteredMemes.length);
    setDisplayedMemes(prev => append ? [...prev, ...newMemes] : newMemes);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const toggleFavorite = (meme) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(meme.id)
        ? prev.filter(id => id !== meme.id)
        : [...prev, meme.id];
      
      localStorage.setItem('favoriteMemes', JSON.stringify(newFavorites));
      return newFavorites;
    });
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
      console.error('Download error:', error);
      toast.error('Failed to download meme');
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 -z-10" />
      <div className="fixed inset-0 backdrop-blur-xl -z-10" />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Glass Effect */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 dark:border-gray-700/20 shadow-xl">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Meme Explorer
          </h1>
          
          {/* Search and Filter Section */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search memes..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full p-4 rounded-xl pl-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md
                border border-gray-200/20 dark:border-gray-700/20
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-all duration-300"
              />
              <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm
                    ${activeFilter === filter.id
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedMemes.map((meme) => (
            <div
              key={meme.id}
              className="group relative rounded-2xl overflow-hidden bg-white/40 dark:bg-gray-800/40 
                backdrop-blur-md shadow-lg border border-white/20 dark:border-gray-700/20
                transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="relative">
                <img
                  src={meme.url}
                  alt={meme.name}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="p-4">
                <h3 className="font-medium mb-2 truncate text-gray-900 dark:text-white">
                  {meme.name}
                </h3>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleFavorite(meme)}
                    className="text-2xl text-red-500 hover:text-red-600 transition-colors"
                  >
                    {favorites.includes(meme.id) ? <HiHeart /> : <HiOutlineHeart />}
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleDownload(meme)}
                      className="text-2xl text-violet-500 hover:text-violet-600 transition-colors"
                    >
                      <HiDownload />
                    </button>
                    <button
                      onClick={() => handleShare({
                        name: meme.name,
                        url: meme.url,
                        type: 'meme'
                      })}
                      className="text-2xl text-pink-500 hover:text-pink-600 transition-colors"
                    >
                      <HiShare />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center my-8">
            <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        )}

        {/* Load More Button - Optional fallback */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl 
                hover:from-pink-600 hover:to-violet-600 transition-all duration-300"
            >
              Load More
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedMemes.length === 0 && (
          <div className="text-center py-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/20">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? 'No memes found matching your search' 
                : activeFilter === 'favorites' 
                  ? 'No favorite memes yet' 
                  : 'No memes available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
