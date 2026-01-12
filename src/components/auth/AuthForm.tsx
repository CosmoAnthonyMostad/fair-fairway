import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Welcome to the golf app.",
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/90 via-primary to-primary-dark relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle golf-themed decorative elements */}
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-10" viewBox="0 0 400 200" fill="none">
          <path d="M0 150 Q100 100 200 150 T400 150 L400 200 L0 200 Z" fill="currentColor" className="text-primary-foreground" />
        </svg>
      </div>

      {/* Logo header - bigger arching text, no flag */}
      <div className="flex items-center justify-center pt-16 pb-8 relative z-10">
        <svg viewBox="0 0 300 80" className="w-80 h-24">
          <defs>
            <path id="textArc" d="M 20 65 Q 150 5 280 65" fill="none" />
          </defs>
          <text className="fill-primary-foreground font-display font-bold" style={{ fontSize: '42px' }}>
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              GOLF APP
            </textPath>
          </text>
        </svg>
      </div>

      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8 relative z-10">
        {/* Welcome text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-primary-foreground mb-3">
            {isLogin ? 'Welcome back!' : 'Join the fairway'}
          </h2>
          <p className="text-primary-foreground/80 text-base max-w-xs mx-auto">
            {isLogin
              ? 'Sign in to continue tracking your golf matches'
              : 'Create an account to start tracking matches with friends'}
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-14 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-12 h-14 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-semibold text-base shadow-lg shadow-foreground/20 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-muted/20">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <span className="font-semibold text-primary underline-offset-2 hover:underline">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </span>
              </button>
            </div>
          </div>

          {/* Terms text - black text below white card */}
          <p className="text-center text-xs text-foreground/70 mt-6 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;