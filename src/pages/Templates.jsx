import React, { useState, useEffect } from 'react';
import { HiSearch, HiDownload, HiShare } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { handleShare } from '../utils/shareUtils';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('https://api.imgflip.com/get_memes');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.memes);
      }
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 -z-10" />
      <div className="fixed inset-0 backdrop-blur-xl -z-10" />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Glass Effect */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 dark:border-gray-700/20 shadow-xl">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Meme Templates
          </h1>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 rounded-xl pl-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md
                border border-gray-200/20 dark:border-gray-700/20
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-all duration-300"
            />
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative rounded-2xl overflow-hidden bg-white/40 dark:bg-gray-800/40 
                  backdrop-blur-md shadow-lg border border-white/20 dark:border-gray-700/20
                  transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="relative">
                  <img
                    src={template.url}
                    alt={template.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium mb-2 truncate text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {template.width} x {template.height}
                    </span>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleShare({
                          name: template.name,
                          url: template.url,
                          type: 'template'
                        })}
                        className="text-xl text-pink-500 hover:text-pink-600 transition-colors"
                      >
                        <HiShare />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(template.url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `template-${template.name.replace(/\s+/g, '-')}.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast.success('Template downloaded!');
                          } catch (error) {
                            toast.error('Failed to download template');
                          }
                        }}
                        className="text-xl text-violet-500 hover:text-violet-600 transition-colors"
                      >
                        <HiDownload />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
          <div className="text-center py-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/20">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No templates found matching your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
