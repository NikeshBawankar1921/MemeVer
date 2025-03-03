import React, { useState } from 'react';
import { HiX, HiPlus, HiMinus, HiDownload, HiClipboard } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const BASE_URL = 'https://api.memegen.link';

const MemeGeneratorModal = ({ template, onClose, onGenerate }) => {
  const [texts, setTexts] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const darkMode = useSelector((state) => state.theme.darkMode);

  const getPreviewUrl = () => {
    if (!template?.id) return '';
    
    const processedTexts = texts.map(text => {
      if (!text || text.trim() === '') return '_';
      return encodeURIComponent(text.trim().replace(/\s+/g, '_'));
    });
    
    return `${BASE_URL}/images/${template.id}/${processedTexts.join('/')}.jpg`;
  };

  const handleTextChange = (index, value) => {
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const addTextBox = () => {
    if (texts.length < 5) {
      setTexts([...texts, '']);
    } else {
      toast.error('Maximum 5 text boxes allowed');
    }
  };

  const removeTextBox = (index) => {
    if (texts.length > 1) {
      const newTexts = texts.filter((_, i) => i !== index);
      setTexts(newTexts);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(getPreviewUrl());
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${template.id}.jpg`;
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

  const handleCopyUrl = () => {
    const url = getPreviewUrl();
    navigator.clipboard.writeText(url)
      .then(() => toast.success('URL copied to clipboard!'))
      .catch(() => toast.error('Failed to copy URL'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!texts.some(text => text.trim())) {
      toast.error('Please enter at least one line of text');
      return;
    }

    try {
      setLoading(true);
      const url = getPreviewUrl();
      onGenerate(url);
      toast.success('Meme generated successfully!');
      onClose();
    } catch (error) {
      console.error('Meme generation error:', error);
      toast.error('Failed to generate meme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`w-full max-w-xl rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create Meme: {template.name}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Preview */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            <img
              src={getPreviewUrl() || template.blank}
              alt="Meme preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Preview image load error:', e);
                e.target.src = template.blank;
              }}
            />
          </div>

          {/* Text Inputs */}
          <div className="space-y-4">
            {texts.map((text, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                    placeholder={`Text line ${index + 1}`}
                  />
                </div>
                {texts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTextBox(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-md dark:hover:bg-red-900"
                  >
                    <HiMinus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Text Box Button */}
          <button
            type="button"
            onClick={addTextBox}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <HiPlus className="w-5 h-5" />
            Add Text Box
          </button>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={handleDownload}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <HiDownload className="w-5 h-5" />
              Download
            </button>
            <button
              type="button"
              onClick={handleCopyUrl}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <HiClipboard className="w-5 h-5" />
              Copy URL
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-md ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-pink-600 hover:to-violet-600 shadow-lg hover:shadow-xl'
              } text-white disabled:opacity-50`}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemeGeneratorModal;
