
import React, { useState } from 'react';
import { Sparkles, Brain, ShieldCheck, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

interface LandingPageProps {
  onLogin: (name: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const simulateGoogleLogin = () => {
    setIsLoading(true);
    // Simulate the OAuth redirect/popup delay
    setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        onLogin("Lia Jette");
      }, 800);
    }, 1500);
  };

  return (
    <div className={`min-h-screen bg-white flex flex-col transition-opacity duration-700 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <Sparkles size={24} fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Lia- Jette's AI App</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-7xl mx-auto px-6 py-12 gap-12">
        
        {/* Left Content */}
        <div className="flex-1 space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
            <Brain size={14} />
            Unified Intelligence Platform
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
            Design your world with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Lia- Jette's AI.
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 leading-relaxed">
            Experience a new standard of productivity. A secure, personalized AI environment built to enhance your creativity, streamline your work, and organize your life.
          </p>

          <div className="space-y-6">
            <button 
              onClick={simulateGoogleLogin}
              disabled={isLoading}
              className="w-full max-w-sm flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-2xl px-6 py-4 font-bold text-slate-700 hover:bg-slate-50 hover:shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {isLoading ? 'Connecting Securely...' : 'Continue with Google'}
            </button>
            
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Google SSO Secure</span>
              <span className="flex items-center gap-1 text-slate-300">|</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Local Data Only</span>
            </div>
          </div>
        </div>

        {/* Right Visual */}
        <div className="flex-1 relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-10" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
              <div className="h-32 bg-indigo-50 rounded-xl w-full flex items-center justify-center text-indigo-200">
                <Sparkles size={48} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
