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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleBack = () => {
    setShowEmailForm(false);
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
      <div className="relative z-10 pt-20 pb-4 text-center px-4">
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
              {showEmailForm 
                ? (isLogin ? 'Sign In' : 'Create Account')
                : 'Create an Account'}
            </h3>

            {!showEmailForm ? (
              /* Initial view - Google and Email buttons */
              <div className="space-y-3">
                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full h-12 rounded-2xl border-muted/40 bg-white hover:bg-muted/10 text-foreground font-medium text-base transition-all"
                >
                  {googleLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </span>
                  )}
                </Button>

                {/* Email Button */}
                <Button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-3">
                    <Mail className="w-5 h-5" />
                    Continue with Email
                  </span>
                </Button>

                {/* Already have account - Login link */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(true);
                      setIsLogin(true);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Already have an account?{' '}
                    <span className="font-semibold text-primary underline-offset-2 hover:underline">
                      Log in
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Email form view */
              <div className="space-y-3">
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

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
