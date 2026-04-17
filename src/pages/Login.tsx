import { useState } from 'react';
import { publicAsset } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSignup = activeTab === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const result = await signup(username.trim(), password);
        if (result.success) {
          toast.success(result.error || 'Account created!');
          setActiveTab('signin');
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await login(username.trim(), password);
        if (!result.success) toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left hero */}
      <section className="hidden md:flex md:w-1/2 lg:w-2/5 bg-[#0C2623] text-white px-10 lg:px-16 py-10 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <img src={publicAsset('logo.svg')} alt="Fintoxa logo" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-heading font-bold">Fintoxa</span>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-heading font-black leading-tight tracking-tight">
              Your finances,<br />
              <span className="text-[#F2C96D]">crystal clear.</span>
            </h1>
            <p className="mt-6 text-base text-[#D1E2DF] font-medium max-w-md leading-relaxed">
              Track every amount, set smart budgets, and understand your spending patterns — all stored privately in your browser.
            </p>

            <div className="mt-12 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#F2C96D]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Spending Analytics</h3>
                  <p className="text-sm text-[#A7C1BC]">Visual charts that show exactly where your money goes</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#4CD964]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">100% Private</h3>
                  <p className="text-sm text-[#A7C1BC]">All data stays in your browser — no servers, no accounts</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#f97316]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Budget Control</h3>
                  <p className="text-sm text-[#A7C1BC]">Set monthly limits and get alerted when you overspend.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs text-[#6F8F8A] font-medium">
            © {new Date().getFullYear()} Fintoxa. Thanks to SparkOn. No Subscription.
          </p>
        </div>
      </section>

      {/* Right auth panel */}
      <section className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-16">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#0C2623] p-4 shadow-xl border border-white/5 mb-4 group hover:scale-105 transition-transform duration-300">
               <img src={publicAsset('logo.svg')} alt="Fintoxa logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <h2 className="text-2xl font-heading font-black text-foreground tracking-tight">Fintoxa</h2>
          </div>

          <Card className="shadow-2xl border-border bg-[#0C2623] text-white overflow-hidden">
            <CardContent className="p-6 lg:p-8">
              {/* Tabs */}
              <div className="flex mb-8 rounded-xl bg-secondary p-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'signin'
                      ? 'bg-[#0C2623] text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'signup'
                      ? 'bg-[#0C2623] text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-heading font-bold mb-1">
                  {activeTab === 'signin' ? 'Welcome back' : 'Create Account'}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {activeTab === 'signin'
                    ? 'Sign in to your Fintoxa account'
                    : 'Start tracking and understanding your spending.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Display Name"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Strong Password"
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="fintoxa" className="w-full py-6 text-base font-bold shadow-lg" disabled={loading}>
                  {loading ? 'Please wait...' : activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <a 
                  href="https://wa.me/233246104245" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[#25D366] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span>Contact owner</span>
                </a>
              </div>


            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
