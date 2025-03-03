import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCredentials = localStorage.getItem('userCredentials');
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials);
      setEmail(email);
      setPassword(password);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }));
      localStorage.setItem('userCredentials', JSON.stringify({
        email: email,
        password: password
      }));
      toast.success('Successfully logged in!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 z-0" />
      <div className="absolute inset-0 backdrop-blur-xl z-0" />
      
      {/* Login card */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <button
                onClick={() => navigate('/auth/register')}
                className="font-medium text-violet-600 hover:text-pink-600 transition-colors duration-300"
              >
                create a new account
              </button>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <HiMail className="h-5 w-5 text-gray-900 dark:text-white" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 
                    border border-gray-300/50 dark:border-gray-600/50 
                    rounded-xl bg-white/50 dark:bg-gray-900/50 
                    placeholder-gray-500 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    transition-all duration-300"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <HiLockClosed className="h-5 w-5 text-gray-900 dark:text-white" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 
                border border-transparent text-sm font-medium rounded-xl text-white
                transition-all duration-300 
                ${loading
                  ? 'bg-violet-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-pink-600 hover:to-violet-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
