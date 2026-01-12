import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronRight, User, Users, Trophy } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Set up the onSelect callback properly with useEffect
  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on('select', onSelect);
    onSelect(); // Call once to set initial state
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const slides = [
    {
      title: "Build Your Golf Profile",
      description: "Set your handicap index and track your personal stats across all your rounds.",
      icon: User,
    },
    {
      title: "Add Friends & Build Groups",
      description: "Connect with your golf buddies and create groups for your regular games.",
      icon: Users,
    },
    {
      title: "Track Matches & Fair Handicaps",
      description: "Record your matches and let the app calculate fair handicaps that improve over time.",
      icon: Trophy,
    },
  ];

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Full-page carousel */}
      <div className="h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <div key={index} className="flex-none w-full h-full flex flex-col">
                {/* Slide content */}
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="w-48 h-48 rounded-full gradient-primary flex items-center justify-center shadow-lg mb-8">
                    <Icon className="w-24 h-24 text-primary-foreground" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground text-center mb-4">
                    {slide.title}
                  </h2>
                  <p className="text-muted-foreground text-center max-w-sm">
                    {slide.description}
                  </p>
                </div>

                {/* Bottom section for this slide */}
                <div className="px-8 pb-12 space-y-6">
                  {/* Dot indicators */}
                  <div className="flex justify-center gap-2">
                    {slides.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dotIndex === index
                            ? 'w-6 bg-primary'
                            : 'w-2 bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Swipe hint or Get Started button */}
                  {index < 2 ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse-gentle h-12">
                      <span className="text-sm">Swipe to continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  ) : (
                    <Button
                      onClick={onComplete}
                      size="lg"
                      className="w-full gradient-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition-opacity h-12"
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;