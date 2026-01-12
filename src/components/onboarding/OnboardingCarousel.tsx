import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

// Custom SVG illustrations for each slide
const GolferIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Golfer body */}
    <circle cx="100" cy="50" r="25" className="fill-primary" />
    {/* Golfer torso */}
    <path d="M75 75 L80 130 L120 130 L125 75 Z" className="fill-primary" />
    {/* Golfer legs */}
    <path d="M85 130 L75 180 L90 180 L95 130" className="fill-primary-dark" />
    <path d="M105 130 L110 180 L125 180 L115 130" className="fill-primary-dark" />
    {/* Golf club */}
    <rect x="130" y="40" width="4" height="80" rx="2" className="fill-foreground/70" />
    <path d="M128 40 L140 35 L140 50 L128 45 Z" className="fill-foreground/70" />
    {/* Golf ball */}
    <circle cx="155" cy="165" r="10" className="fill-white stroke-foreground/30" strokeWidth="2" />
    {/* Flag in distance */}
    <rect x="45" y="100" width="3" height="50" className="fill-foreground/50" />
    <path d="M48 100 L48 120 L65 110 Z" className="fill-accent" />
  </svg>
);

const FriendsIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Left person */}
    <circle cx="60" cy="60" r="22" className="fill-primary" />
    <path d="M38 85 L42 140 L78 140 L82 85 Z" className="fill-primary" />
    <path d="M45 140 L40 175 L55 175 L55 140" className="fill-primary-dark" />
    <path d="M65 140 L65 175 L80 175 L75 140" className="fill-primary-dark" />
    
    {/* Right person */}
    <circle cx="140" cy="60" r="22" className="fill-accent" />
    <path d="M118 85 L122 140 L158 140 L162 85 Z" className="fill-accent" />
    <path d="M125 140 L120 175 L135 175 L135 140" className="fill-accent/80" />
    <path d="M145 140 L145 175 L160 175 L155 140" className="fill-accent/80" />
    
    {/* Connection heart/bond */}
    <path d="M100 110 C90 95 75 100 75 115 C75 135 100 150 100 150 C100 150 125 135 125 115 C125 100 110 95 100 110" className="fill-primary/30" />
    
    {/* Golf elements */}
    <circle cx="50" cy="185" r="6" className="fill-white stroke-foreground/30" strokeWidth="1.5" />
    <circle cx="150" cy="185" r="6" className="fill-white stroke-foreground/30" strokeWidth="1.5" />
  </svg>
);

const TrophyIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Trophy cup */}
    <path d="M60 50 L65 110 L135 110 L140 50 Z" className="fill-accent" />
    <ellipse cx="100" cy="50" rx="40" ry="12" className="fill-accent" />
    
    {/* Trophy handles */}
    <path d="M55 60 C30 60 25 85 50 95" className="fill-none stroke-accent" strokeWidth="8" strokeLinecap="round" />
    <path d="M145 60 C170 60 175 85 150 95" className="fill-none stroke-accent" strokeWidth="8" strokeLinecap="round" />
    
    {/* Trophy stem */}
    <rect x="90" y="110" width="20" height="30" className="fill-primary-dark" />
    
    {/* Trophy base */}
    <rect x="70" y="140" width="60" height="12" rx="3" className="fill-primary" />
    <rect x="60" y="152" width="80" height="15" rx="4" className="fill-primary-dark" />
    
    {/* Star on trophy */}
    <path d="M100 65 L103 75 L114 75 L105 82 L108 93 L100 86 L92 93 L95 82 L86 75 L97 75 Z" className="fill-white" />
    
    {/* Sparkles */}
    <circle cx="45" cy="45" r="3" className="fill-accent/60" />
    <circle cx="155" cy="40" r="4" className="fill-primary/60" />
    <circle cx="160" cy="130" r="3" className="fill-accent/60" />
    <circle cx="35" cy="120" r="3" className="fill-primary/60" />
  </svg>
);

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on('select', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const slides = [
    {
      title: "Build Your Golf Profile",
      description: "Set your handicap index and track your personal stats across all your rounds.",
      illustration: <GolferIllustration />,
    },
    {
      title: "Add Friends & Build Groups",
      description: "Connect with your golf buddies and create groups for your regular games.",
      illustration: <FriendsIllustration />,
    },
    {
      title: "Track Matches & Fair Handicaps",
      description: "Record your matches and let the app calculate fair handicaps that improve over time.",
      illustration: <TrophyIllustration />,
    },
  ];

  return (
    <div className="h-screen bg-muted overflow-hidden">
      {/* Full-page carousel */}
      <div className="h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="flex-none w-full h-full flex flex-col">
              {/* Illustration area with solid background */}
              <div className="flex-1 flex items-center justify-center bg-muted px-12 pt-16">
                <div className="w-56 h-56">
                  {slide.illustration}
                </div>
              </div>

              {/* Content area */}
              <div className="bg-background rounded-t-[2.5rem] px-8 pt-10 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <h2 className="text-2xl font-display font-bold text-foreground text-center mb-3">
                  {slide.title}
                </h2>
                <p className="text-muted-foreground text-center max-w-xs mx-auto mb-8">
                  {slide.description}
                </p>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mb-6">
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
                  <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse-gentle h-14">
                    <span className="text-sm">Swipe to continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                ) : (
                  <Button
                    onClick={onComplete}
                    size="lg"
                    className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-semibold shadow-lg transition-all hover:shadow-xl"
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;