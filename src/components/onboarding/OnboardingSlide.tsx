import { ReactNode } from 'react';

interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: ReactNode;
}

const OnboardingSlide = ({ title, description, illustration }: OnboardingSlideProps) => {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center h-full">
      <div className="mb-8 w-64 h-64 flex items-center justify-center">
        {illustration}
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-3">
        {title}
      </h2>
      <p className="text-muted-foreground text-base max-w-xs">
        {description}
      </p>
    </div>
  );
};

export default OnboardingSlide;