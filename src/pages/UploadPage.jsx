import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { HiUpload, HiOutlineX } from 'react-icons/hi';
import { IMGBB_API_KEY } from '../config/constants';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload memes');
      navigate('/auth/login');
      return;
    }

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData for ImgBB upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', IMGBB_API_KEY);

      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      const imgbbData = await response.json();

      if (!imgbbData.success) {
        throw new Error('Image upload failed');
      }

      // Save meme details to Firestore
      await addDoc(collection(db, 'memes'), {
        url: imgbbData.data.url, // ImgBB image URL
        caption: caption,
        createdAt: new Date(),
        userId: user.uid,
        likes: 0,
        comments: [],
        originalFileName: file.name,
        imgbbDeleteUrl: imgbbData.data.delete_url
      });

      toast.success('Meme uploaded successfully!');
      navigate('/explore');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload meme');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 ">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Upload Meme</h1>

        {/* File Upload */}
        <div className="mb-8">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <HiUpload className="inline-block mr-2" />
            Select File
          </button>
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div className="mb-8">
            <div className="relative">
              <button
                onClick={() => setPreviewUrl('')}
                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
              >
                <HiOutlineX className="text-xl" />
              </button>
              <img
                src={previewUrl}
                alt="Meme Preview"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}

        {/* Caption Editor */}
        <div className="mb-8">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a funny caption..."
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 w-full"
            rows={4}
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg hover:bg-gradient-to-r hover:from-violet-600 hover:to-red-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Uploading...' : 'Upload Meme'}
        </button>
      </div>
    </div>
  );
};

export default UploadPage;
