import { useState } from 'react';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import AuthForm from '@/components/auth/AuthForm';

const Onboarding = () => {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingCarousel onComplete={() => setShowAuth(true)} />
    </div>
  );
};

export default Onboarding;