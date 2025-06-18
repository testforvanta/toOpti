import React, { useState, FormEvent } from 'react';
import { useTheme } from '../context/ThemeContext'; // For styling consistency

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ error?: string }>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign In and Sign Up

  const { theme } = useTheme();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
        setError("Email and password cannot be empty.");
        setIsLoading(false);
        return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
    }

    const result = await onLogin(email, password);

    if (result.error) {
      // Map Supabase common errors to user-friendly messages
      if (result.error.includes("Invalid login credentials")) {
        setError("Login attempt failed. Please verify your email and ensure your password is correct.");
      } else if (result.error.includes("User already registered")) {
        setError("This email is already registered. Please try signing in or use a different email.");
      } else if (result.error.includes("Password should be at least 6 characters")) {
        setError("Password must be at least 6 characters long.");
      } else if (result.error.toLowerCase().includes("email rate limit exceeded")) {
        setError("Too many attempts. Please try again later.");
      }
      else {
        setError(result.error || `An unexpected error occurred during ${isSignUp ? 'sign up' : 'sign in'}.`);
      }
    }
    // On successful login/signup, AuthContext will handle redirect via App.tsx
    setIsLoading(false);
  };
  
  const inputBaseClass = "w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors duration-150 shadow-sm focus:shadow dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:placeholder-zinc-500";
  const errorTextClass = "text-red-500 dark:text-red-400 text-sm mt-1 text-center";


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900 p-4">
      <div className="bg-white dark:bg-zinc-800/70 backdrop-blur-lg p-8 md:p-10 rounded-xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">
            {isSignUp ? 'Sign up to access the dashboard.' : 'Sign in to continue to your dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputBaseClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className={inputBaseClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          {error && <p className={errorTextClass}>{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null); // Clear errors when switching mode
            }}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
            disabled={isLoading}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
         <p className="mt-8 text-xs text-center text-gray-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} The Buy Tech. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;