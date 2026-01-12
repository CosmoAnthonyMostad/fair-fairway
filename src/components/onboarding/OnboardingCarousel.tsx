import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import OnboardingSlide from './OnboardingSlide';
import { Button } from '@/components/ui/button';
import { ChevronRight, User, Users, Trophy } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      if (currentIndex === 2) {
        onComplete();
      } else {
        emblaApi.scrollNext();
      }
    }
  }, [emblaApi, currentIndex, onComplete]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Set up the onSelect callback
  useState(() => {
    if (emblaApi) {
      emblaApi.on('select', onSelect);
      onSelect();
    }
  });

  const slides = [
    {
      title: "Build Your Golf Profile",
      description: "Set your handicap index and track your personal stats across all your rounds.",
      illustration: (
        <div className="w-48 h-48 rounded-full gradient-primary flex items-center justify-center shadow-lg">
          <User className="w-24 h-24 text-primary-foreground" strokeWidth={1.5} />
        </div>
      ),
    },
    {
      title: "Add Friends & Build Groups",
      description: "Connect with your golf buddies and create groups for your regular games.",
      illustration: (
        <div className="w-48 h-48 rounded-full gradient-primary flex items-center justify-center shadow-lg">
          <Users className="w-24 h-24 text-primary-foreground" strokeWidth={1.5} />
        </div>
      ),
    },
    {
      title: "Track Matches & Fair Handicaps",
      description: "Record your matches and let the app calculate fair handicaps that improve over time.",
      illustration: (
        <div className="w-48 h-48 rounded-full gradient-primary flex items-center justify-center shadow-lg">
          <Trophy className="w-24 h-24 text-primary-foreground" strokeWidth={1.5} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="flex-none w-full h-full">
              <OnboardingSlide {...slide} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 space-y-6">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Swipe hint or Get Started button */}
        {currentIndex < 2 ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse-gentle">
            <span className="text-sm">Swipe to continue</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        ) : (
          <Button
            onClick={scrollNext}
            size="lg"
            className="w-full gradient-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingCarousel;