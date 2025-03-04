import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { auth, db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { HiCamera, HiOutlinePencil, HiSave, HiLogout, HiPhotograph, HiPencil, HiOutlineHeart, HiHeart, HiUpload, HiTrash } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, arrayRemove, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { IMGBB_API_KEY } from '../config/constants';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FaHeart, FaDownload } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [likedMemes, setLikedMemes] = useState([]);
  const [uploadedMemes, setUploadedMemes] = useState([]);
  const [activeTab, setActiveTab] = useState('uploaded'); // 'uploaded' or 'liked'
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const darkMode = useSelector((state) => state.theme.darkMode);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || user.displayName || '');
            setBio(userData.bio || '');
            
            // Prioritize Firestore photoURL, fallback to Auth photoURL
            const photoURL = userData.photoURL || user.photoURL || '';
            setProfilePicture(photoURL);
            
            // If the photoURL in Firestore is different from Auth, update Auth
            if (userData.photoURL && userData.photoURL !== user.photoURL) {
              await updateProfile(user, {
                photoURL: userData.photoURL
              });
            }
            
            // If the photoURL in Auth is different from Firestore, update Firestore
            if (user.photoURL && (!userData.photoURL || userData.photoURL !== user.photoURL)) {
              await updateDoc(doc(db, 'users', user.uid), {
                photoURL: user.photoURL
              });
              setProfilePicture(user.photoURL);
            }
            
            // Get liked memes from user document
            const likedMemesData = userData.likedMemes || [];
            setLikedMemes(likedMemesData);
            
            // Get uploaded memes from user document
            const uploadedMemesData = userData.uploadedMemes || [];
            setUploadedMemes(uploadedMemesData);
          } else {
            // Initialize user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              displayName: user.displayName || '',
              email: user.email,
              photoURL: user.photoURL || '',
              createdAt: new Date().toISOString(),
              likedMemes: [],
              uploadedMemes: [],
              bio: ''
            });
            
            setDisplayName(user.displayName || '');
            setProfilePicture(user.photoURL || '');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load profile data');
        } finally {
          setIsLoading(false);
        }
      } else {
        navigate('/auth/login');
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio
      });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    if (!user) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create form data for ImgBB upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', IMGBB_API_KEY);
      
      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        const imageUrl = data.data.url;
        
        // Update Firebase Auth profile
        await updateProfile(user, {
          photoURL: imageUrl
        });
        
        // Update Firestore document
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: imageUrl
        });
        
        setProfilePicture(imageUrl);
        toast.success('Profile picture updated successfully');
      } else {
        throw new Error('Failed to upload image to ImgBB');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/auth/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleUnlike = async (meme) => {
    if (!user) {
      toast.error('Please login to manage liked memes');
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

      // Remove from liked memes
      await updateDoc(userRef, {
        likedMemes: likedMemes.filter((m) => m.id !== meme.id)
      });

      // Update local state
      setLikedMemes((prevMemes) => prevMemes.filter((m) => m.id !== meme.id));
      toast.success('Removed from liked memes');
    } catch (error) {
      console.error('Error removing like:', error);
      toast.error('Failed to remove from liked memes');
    }
  };

  const handleDownload = async (meme) => {
    try {
      // Use meme.url if it exists, otherwise fall back to meme.imageUrl
      const imageUrl = meme.url || meme.imageUrl;
      const response = await fetch(imageUrl);
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

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Card */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 shadow-lg">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HiPhotograph className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <HiCamera className="w-5 h-5" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Write something about yourself..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <HiSave className="w-5 h-5" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {displayName || 'Anonymous User'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-500 hover:text-indigo-500 transition-colors"
                    >
                      <HiOutlinePencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <HiLogout className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">About</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {bio || 'No bio yet'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Uploaded and Liked Memes */}
      <div className="mt-8">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${
              activeTab === 'uploaded'
                ? 'border-b-2 border-indigo-500 text-indigo-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <HiUpload className="w-5 h-5" />
              <span>Uploaded Memes</span>
              {uploadedMemes.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {uploadedMemes.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${
              activeTab === 'liked'
                ? 'border-b-2 border-indigo-500 text-indigo-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <HiOutlineHeart className="w-5 h-5" />
              <span>Liked Memes</span>
              {likedMemes.length > 0 && (
                <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {likedMemes.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Uploaded Memes Section */}
        {activeTab === 'uploaded' && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploadedMemes.map((meme) => (
                <motion.div
                  key={meme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-white/20 dark:border-gray-700/20"
                >
                  <div 
                    className="relative cursor-pointer" 
                    onClick={() => navigate(`/meme/${meme.id}`)}
                  >
                    <img
                      src={meme.imageUrl}
                      alt={meme.caption || 'Meme'}
                      className="w-full aspect-square object-cover"
                    />
                    {meme.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                        <p className="text-white text-sm truncate">{meme.caption}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-indigo-500">
                        <HiUpload className="w-5 h-5 mr-1" />
                        <span className="text-sm">Uploaded</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {meme.createdAt ? new Date(meme.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {uploadedMemes.length === 0 && (
              <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/20">
                <HiUpload className="w-16 h-16 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">You haven't uploaded any memes yet</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Create a Meme
                </button>
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Liked Memes Section */}
        {activeTab === 'liked' && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedMemes.map((meme) => (
                <motion.div
                  key={meme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-white/20 dark:border-gray-700/20 relative group"
                >
                  <div 
                    className="relative cursor-pointer" 
                    onClick={() => navigate(`/meme/${meme.id}`)}
                  >
                    <img
                      src={meme.url}
                      alt={meme.caption || meme.name || 'Meme'}
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available';
                      }}
                    />
                    {(meme.caption || meme.name) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                        <p className="text-white text-sm truncate">{meme.caption || meme.name}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-red-500">
                        <HiHeart className="w-5 h-5 mr-1" />
                        <span className="text-sm">Liked</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {meme.createdAt ? new Date(meme.createdAt).toLocaleDateString() : 
                         meme.timestamp ? new Date(meme.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  {/* Unlike button overlay */}
                  <button
                    onClick={() => handleUnlike(meme)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    title="Unlike this meme"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>

                  {/* Download button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(meme);
                    }}
                    className="absolute top-2 left-2 p-2 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-600"
                    title="Download this meme"
                  >
                    <FaDownload className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
            
            {likedMemes.length === 0 && (
              <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/20">
                <HiOutlineHeart className="w-16 h-16 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">No liked memes yet</p>
                <button
                  onClick={() => navigate('/explorer')}
                  className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Explore Memes
                </button>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Profile;