import React, { useState } from 'react';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { HiMail, HiLockClosed, HiUser } from 'react-icons/hi';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate phone number format
    if (name === 'contact') {
      const phoneRegex = /^\+\d{1,4}\d{10}$/; // Example: +911234567890
      if (!phoneRegex.test(value)) {
        setContactError('Enter a valid phone number with country code (e.g., +911234567890)');
      } else {
        setContactError('');
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (contactError) return;

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        contact: formData.contact,
        createdAt: new Date().toISOString(),
        likedMemes: [],
        uploadedMemes: [],
        bio: ''
      });

      showSuccessToast('Registration successful!');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      showErrorToast(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 z-0" />
      <div className="absolute inset-0 backdrop-blur-xl z-0" />
      
      {/* Register card */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="font-medium text-violet-600 hover:text-pink-600 transition-colors duration-300"
              >
                sign in to your account
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              {/* Name Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiUser className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 
                    border border-gray-300/50 dark:border-gray-600/50 
                    rounded-xl bg-white/50 dark:bg-gray-900/50 
                    placeholder-gray-500 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    transition-all duration-300"
                  placeholder="Full Name"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiMail className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 
                    border border-gray-300/50 dark:border-gray-600/50 
                    rounded-xl bg-white/50 dark:bg-gray-900/50 
                    placeholder-gray-500 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    transition-all duration-300"
                  placeholder="Email address"
                />
              </div>

              {/* Contact Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiUser className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <input
                  type="tel"
                  name="contact"
                  required
                  value={formData.contact}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 
                    border border-gray-300/50 dark:border-gray-600/50 
                    rounded-xl bg-white/50 dark:bg-gray-900/50 
                    placeholder-gray-500 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    transition-all duration-300"
                  placeholder="Phone number (+911234567890)"
                />
                {contactError && (
                  <p className="mt-1 text-xs text-red-500">{contactError}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiLockClosed className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 
                    border border-gray-300/50 dark:border-gray-600/50 
                    rounded-xl bg-white/50 dark:bg-gray-900/50 
                    placeholder-gray-500 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    transition-all duration-300"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || contactError}
                className={`group relative w-full flex justify-center py-3 px-4 
                  border border-transparent text-sm font-medium rounded-xl text-white
                  transition-all duration-300 
                  ${loading || contactError
                    ? 'bg-violet-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-pink-600 hover:to-violet-600 shadow-lg hover:shadow-xl'
                  }`}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
