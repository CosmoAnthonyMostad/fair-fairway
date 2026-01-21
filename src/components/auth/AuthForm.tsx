import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react';
import golfHoleBackground from '@/assets/golf-hole-background.jpg';

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

  const handleBack = () => {
    setIsLogin(false);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${golfHoleBackground})` }}
      />
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Big Bubble Letters Header */}
      <div className="relative z-10 pt-safe pb-4 text-center px-4 mt-6">
        {/* Welcome */}
        <h1 
          className="text-6xl sm:text-7xl font-black tracking-tight leading-none"
          style={{
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif",
            color: 'white',
            textShadow: '4px 4px 0 #166534, -2px -2px 0 #166534, 2px -2px 0 #166534, -2px 2px 0 #166534, 5px 5px 10px rgba(0,0,0,0.5)',
            WebkitTextStroke: '2.5px #166534',
            paintOrder: 'stroke fill',
          }}
        >
          Welcome
        </h1>
        
        {/* to the */}
        <h2 
          className="text-4xl sm:text-5xl font-bold mt-2"
          style={{
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif",
            color: 'white',
            textShadow: '3px 3px 0 #166534, -1px -1px 0 #166534, 1px -1px 0 #166534, -1px 1px 0 #166534, 4px 4px 8px rgba(0,0,0,0.4)',
            WebkitTextStroke: '2px #166534',
            paintOrder: 'stroke fill',
          }}
        >
          to the
        </h2>
        
        {/* Golf App */}
        <h1 
          className="text-7xl sm:text-8xl font-black tracking-tight mt-2"
          style={{
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif",
            color: 'white',
            textShadow: '5px 5px 0 #166534, -2px -2px 0 #166534, 2px -2px 0 #166534, -2px 2px 0 #166534, 6px 6px 12px rgba(0,0,0,0.5)',
            WebkitTextStroke: '3px #166534',
            paintOrder: 'stroke fill',
          }}
        >
          Golf App
        </h1>
      </div>

      {/* Spacer to push form towards bottom */}
      <div className="flex-1" />

      {/* Form Section at Bottom */}
      <div className="relative z-10 px-6 pb-8">
        <div className="w-full max-w-sm mx-auto">
          {/* Form card with glass effect */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/30 p-6">
            
            {/* Create Account / Sign In header */}
            <h3 className="text-xl font-bold text-center text-foreground mb-4">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h3>

            {(
              <div className="space-y-3">
                {/* Back button - only show when in login mode */}
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-12 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                    />
                  </div>

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
                      className="pl-12 h-12 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
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

                {/* Toggle login/signup + Forgot password */}
                <div className="pt-3 border-t border-muted/20 space-y-2">
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
                  
                  {isLogin && (
                    <button
                      type="button"
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Terms text */}
          <p className="text-center text-xs text-white/80 mt-4 px-4 drop-shadow-md">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
