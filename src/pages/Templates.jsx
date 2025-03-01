import React, { useState, useEffect } from 'react';
import { HiSearch, HiOutlineHeart, HiHeart } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import MemeGeneratorModal from '../components/MemeGeneratorModal';
import toast from 'react-hot-toast';

const BASE_URL = 'https://api.memegen.link';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const darkMode = useSelector((state) => state.theme.darkMode);

  useEffect(() => {
    fetchTemplates();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteTemplates');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      const processedTemplates = data.map(template => ({
        ...template,
        id: template.id,
        name: template.name || template.id.replace(/-/g, ' '),
        blank: `${BASE_URL}/images/${template.id}/_.jpg`,
        example: `${BASE_URL}/images/${template.id}/Your_Text/Goes_Here.jpg`
      }));
      
      setTemplates(processedTemplates);
      setFilteredTemplates(processedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    const filtered = templates.filter(template =>
      template.name.toLowerCase().includes(query)
    );
    setFilteredTemplates(filtered);
  };

  const toggleFavorite = (templateId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      
      localStorage.setItem('favoriteTemplates', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleGeneratedMeme = (memeUrl) => {
    // Copy URL to clipboard
    navigator.clipboard.writeText(memeUrl)
      .then(() => toast.success('Meme URL copied to clipboard!'))
      .catch(() => toast.error('Failed to copy URL'));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Meme Templates
        </h1>
        <div className="relative max-w-xl">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={handleSearch}
            className={`w-full pl-10 pr-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700'
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`group relative rounded-lg overflow-hidden shadow-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Template Image */}
            <div className="aspect-square relative overflow-hidden">
              <img
                src={template.example}
                alt={template.name}
                className="w-full h-full object-cover transform transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.target.src = template.blank;
                }}
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity" />
              
              {/* Action Buttons */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transform transition-transform hover:scale-105"
                >
                  Create Meme
                </button>
              </div>
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {template.name}
                </h3>
                <button
                  onClick={() => toggleFavorite(template.id)}
                  className="text-2xl focus:outline-none"
                >
                  {favorites.includes(template.id) ? (
                    <HiHeart className="text-red-500" />
                  ) : (
                    <HiOutlineHeart className={`${
                      darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                    }`} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No templates found for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Meme Generator Modal */}
      {selectedTemplate && (
        <MemeGeneratorModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onGenerate={handleGeneratedMeme}
        />
      )}
    </div>
  );
};

export default Templates;
