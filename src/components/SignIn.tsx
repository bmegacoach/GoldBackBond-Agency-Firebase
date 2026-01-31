import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from './ui/Button';
import { useAuth } from '@/lib/firebase/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

type AuthView = 'signin' | 'signup';

export function SignIn() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<AuthView>(location.pathname === '/signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setView(location.pathname === '/signup' ? 'signup' : 'signin');
    setError(null);
  }, [location.pathname]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', userCredential.user.email);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err.message.includes('user-not-found')) {
        setError('Email address not found. Please check your email or create an account.');
      } else if (err.message.includes('wrong-password')) {
        setError('Incorrect password. Please try again.');
      } else if (err.message.includes('invalid-email')) {
        setError('Invalid email address format.');
      } else if (err.message.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.message.includes('user-disabled')) {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError(`Authentication failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Logo & Header */}
          <div className="mb-10 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white font-bold text-xl">GB</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GoldBackBond</h1>
            <p className="text-slate-300 text-sm">
              {view === 'signin' ? 'Sign in to your account' : 'Setup your Broadcast Plan'}
            </p>
          </div>

          {/* Plan Summary Card (Only for SignUp) */}
          {view === 'signup' && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-600/20 to-blue-900/40 border border-blue-500/30 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Broadcast Plan</h3>
                  <p className="text-blue-300 text-sm">Enterprise Grade CRM</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">$100<span className="text-sm text-slate-400 font-normal">/mo</span></p>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {['Cloud Sync & Backup', 'Team Collaboration', 'Advanced Analytics', 'Priority Support'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-slate-400">Total due today:</span>
                <span className="text-white font-bold">$299.00</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm font-medium">✕ {error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@goldbandagency.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500"
                />
                <span className="text-slate-300">Remember me</span>
              </label>
              {view === 'signin' && (
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {view === 'signin' ? 'Signing in...' : 'Processing...'}
                </span>
              ) : (
                view === 'signin' ? 'Sign In' : 'Continue to Payment'
              )}
            </Button>
          </form>

          {/* Toggle between sign-in and sign-up */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              {view === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => navigate(view === 'signin' ? '/signup' : '/signin')}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                {view === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              Contact support for account assistance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
