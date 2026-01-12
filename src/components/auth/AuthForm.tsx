import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-primary relative overflow-hidden">

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
            {showEmailForm 
              ? (isLogin ? 'Welcome back!' : 'Create account')
              : 'Join the fairway'}
          </h2>
          <p className="text-primary-foreground/80 text-base max-w-xs mx-auto">
            {showEmailForm
              ? (isLogin ? 'Sign in to continue tracking your golf matches' : 'Enter your details to get started')
              : 'Track matches and build fair handicaps with friends'}
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6">
            
            {!showEmailForm ? (
              /* Initial view - two buttons */
              <div className="space-y-4">
                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full h-14 rounded-2xl border-muted/30 bg-white hover:bg-muted/10 text-foreground font-medium text-base transition-all"
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

                {/* Email Sign In/Up Button */}
                <Button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-semibold text-base shadow-lg shadow-foreground/20 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-3">
                    <Mail className="w-5 h-5" />
                    Continue with Email
                  </span>
                </Button>
              </div>
            ) : (
              /* Email form view */
              <div className="space-y-4">
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
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
                      className="pl-12 h-14 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
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
                      className="pl-12 h-14 rounded-2xl border-muted/30 bg-muted/30 text-base placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                    />
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

                <div className="pt-4 border-t border-muted/20">
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
            )}
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