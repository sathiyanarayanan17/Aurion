import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 to-black items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.08),transparent_60%)]" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Aurion</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Predict charger failures before they cost you.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Real-time monitoring, AI-powered predictions, and proactive maintenance for your EV charging network.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '5 Models', label: 'ML Ensemble' },
              { value: '20+ Cities', label: 'Coverage' },
              { value: '<5 sec', label: 'Alert Speed' },
              { value: '97.4%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Aurion</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back
          </h2>
          <p className="text-slate-400 mb-8">Sign in to access your charging network dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@evnetwork.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" className="rounded border-slate-700 bg-slate-900" />
                Remember me
              </label>
              <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Sign in to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Start free trial
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-600 text-center">
              Demo credentials: any email/password works
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
