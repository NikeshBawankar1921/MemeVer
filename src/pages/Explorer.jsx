import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { HiSearch, HiOutlineHeart, HiHeart, HiDownload, HiShare } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;

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
    setPage(1);
    handleFilterAndSearch();
  }, [searchQuery, activeFilter, allMemes]);

  useEffect(() => {
    handleFilterAndSearch();
  }, [page]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll);
      return () => {
        currentContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const fetchMemes = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.imgflip.com/get_memes');
      if (!response.ok) throw new Error('Failed to fetch memes');
      
      const data = await response.json();
      if (data.success) {
        // Randomly assign trending and new status for demo purposes
        const memesWithStatus = data.data.memes.map(meme => ({
          ...meme,
          isTrending: Math.random() > 0.7,
          isNew: Math.random() > 0.8
        }));
        setAllMemes(memesWithStatus);
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

  const handleFilterAndSearch = () => {
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

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = page * ITEMS_PER_PAGE;
    const newDisplayedMemes = filteredMemes.slice(startIndex, endIndex);
    
    // Check if we've reached the end of available memes
    setHasMore(newDisplayedMemes.length === ITEMS_PER_PAGE);
    
    setDisplayedMemes(prevMemes => 
      page === 1 ? newDisplayedMemes : [...prevMemes, ...newDisplayedMemes]
    );
  };

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    console.log('Scroll Debug:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      loading,
      hasMore
    });

    // Check if we're near the bottom and there are more memes to load
    if (
      scrollHeight - scrollTop <= clientHeight * 1.5 && 
      !loading && 
      hasMore
    ) {
      console.log('Loading more memes');
      setPage(prevPage => prevPage + 1);
    }
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div 
        ref={containerRef} 
        className="container mx-auto px-4 py-8 h-screen overflow-y-auto"
      >
        {/* Header */}
        <h1 className="text-3xl font-bold mb-8">Meme Explorer</h1>
        
        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search memes..."
              value={searchQuery}
              onChange={handleSearch}
              className={`w-full p-4 rounded-lg pl-12 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                  activeFilter === filter.id
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedMemes.map((meme) => (
            <div
              key={meme.id}
              className={`relative rounded-lg overflow-hidden shadow-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              {/* Existing meme card content */}
              <div className="relative group">
                <img
                  src={meme.url}
                  alt={meme.name}
                  className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity" />
              </div>
              
              <div className="p-4">
                <h3 className={`font-medium mb-2 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {meme.name}
                </h3>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleFavorite(meme)}
                    className="text-2xl text-red-500 hover:text-red-600"
                  >
                    {favorites.includes(meme.id) ? <HiHeart /> : <HiOutlineHeart />}
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(meme)}
                      className="text-2xl text-blue-500 hover:text-blue-600"
                    >
                      <HiDownload />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(meme.url);
                        toast.success('Meme URL copied to clipboard!');
                      }}
                      className="text-2xl text-green-500 hover:text-green-600"
                    >
                      <HiShare />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && displayedMemes.length === 0 && (
          <div className="text-center py-8">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
