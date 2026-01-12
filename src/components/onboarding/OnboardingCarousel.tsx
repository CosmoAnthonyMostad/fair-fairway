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
    {/* Ground/grass */}
    <ellipse cx="100" cy="185" rx="80" ry="12" className="fill-primary/20" />
    
    {/* Golfer head */}
    <circle cx="100" cy="50" r="22" className="fill-primary" />
    
    {/* Golfer torso - twisted for backswing */}
    <path d="M78 72 L82 130 L118 130 L122 72 Z" className="fill-primary" />
    
    {/* Left arm - across body */}
    <path d="M78 85 Q60 95 55 110" className="fill-none stroke-primary" strokeWidth="12" strokeLinecap="round" />
    <circle cx="55" cy="110" r="7" className="fill-primary" />
    
    {/* Right arm - extended back in backswing */}
    <path d="M122 80 Q145 60 160 35" className="fill-none stroke-primary" strokeWidth="12" strokeLinecap="round" />
    <circle cx="160" cy="35" r="7" className="fill-primary" />
    
    {/* Golf club - in backswing position */}
    <line x1="160" y1="35" x2="130" y2="5" className="stroke-foreground/70" strokeWidth="3" strokeLinecap="round" />
    <path d="M125 2 L135 8 L130 12 L120 6 Z" className="fill-foreground/70" />
    
    {/* Golfer legs - stance */}
    <path d="M88 130 L75 175 L88 178 L95 130" className="fill-primary/80" />
    <path d="M105 130 L112 175 L125 178 L118 130" className="fill-primary/80" />
    
    {/* Shoes */}
    <ellipse cx="82" cy="178" rx="12" ry="5" className="fill-foreground/60" />
    <ellipse cx="118" cy="178" rx="12" ry="5" className="fill-foreground/60" />
    
    {/* Golf ball on ground */}
    <circle cx="70" cy="175" r="6" className="fill-white" />
    <circle cx="68" cy="173" r="1" className="fill-foreground/20" />
    <circle cx="72" cy="176" r="0.8" className="fill-foreground/20" />
  </svg>
);

const FriendsIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Ground */}
    <ellipse cx="100" cy="188" rx="85" ry="10" className="fill-primary/20" />
    
    {/* Left person - green */}
    <circle cx="65" cy="55" r="20" className="fill-primary" />
    {/* Body */}
    <path d="M45 78 L48 135 L82 135 L85 78 Z" className="fill-primary" />
    {/* Left arm - down */}
    <path d="M45 85 Q35 100 35 120" className="fill-none stroke-primary" strokeWidth="10" strokeLinecap="round" />
    <circle cx="35" cy="120" r="6" className="fill-primary" />
    {/* Right arm - reaching to shake */}
    <path d="M85 90 Q95 95 100 100" className="fill-none stroke-primary" strokeWidth="10" strokeLinecap="round" />
    {/* Legs */}
    <rect x="52" y="135" width="12" height="40" rx="4" className="fill-primary/80" />
    <rect x="68" y="135" width="12" height="40" rx="4" className="fill-primary/80" />
    {/* Shoes */}
    <ellipse cx="58" cy="178" rx="9" ry="5" className="fill-foreground/60" />
    <ellipse cx="74" cy="178" rx="9" ry="5" className="fill-foreground/60" />
    
    {/* Right person - yellow/accent */}
    <circle cx="135" cy="55" r="20" className="fill-accent" />
    {/* Body */}
    <path d="M115 78 L118 135 L152 135 L155 78 Z" className="fill-accent" />
    {/* Right arm - down */}
    <path d="M155 85 Q165 100 165 120" className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round" />
    <circle cx="165" cy="120" r="6" className="fill-accent" />
    {/* Left arm - reaching to shake */}
    <path d="M115 90 Q105 95 100 100" className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round" />
    {/* Legs */}
    <rect x="122" y="135" width="12" height="40" rx="4" className="fill-accent/80" />
    <rect x="138" y="135" width="12" height="40" rx="4" className="fill-accent/80" />
    {/* Shoes */}
    <ellipse cx="128" cy="178" rx="9" ry="5" className="fill-foreground/50" />
    <ellipse cx="144" cy="178" rx="9" ry="5" className="fill-foreground/50" />
    
    {/* Handshake - two hands meeting */}
    <circle cx="100" cy="105" r="8" className="fill-primary" />
    <circle cx="100" cy="105" r="8" className="fill-accent" style={{ clipPath: 'inset(0 50% 0 0)' }} />
  </svg>
);

const PaperPencilIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Paper shadow */}
    <rect x="45" y="35" width="120" height="150" rx="4" className="fill-foreground/10" transform="translate(4, 4)" />
    
    {/* Paper */}
    <rect x="45" y="35" width="120" height="150" rx="4" className="fill-white" />
    <rect x="45" y="35" width="120" height="150" rx="4" className="fill-none stroke-foreground/20" strokeWidth="2" />
    
    {/* Paper fold corner */}
    <path d="M145 35 L165 35 L165 55 Z" className="fill-muted" />
    <path d="M145 35 L145 55 L165 55" className="fill-none stroke-foreground/20" strokeWidth="1" />
    
    {/* Scribble lines - like handwriting */}
    <path d="M60 60 Q80 55 100 60 Q120 65 140 58" className="fill-none stroke-primary" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 80 Q85 75 110 82 Q130 88 145 78" className="fill-none stroke-primary/70" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 100 Q75 95 95 102 Q115 108 130 98" className="fill-none stroke-primary" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 120 Q90 115 120 122 Q140 128 150 118" className="fill-none stroke-primary/70" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 140 Q80 135 100 142 Q115 148 125 140" className="fill-none stroke-primary" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 160 Q70 155 85 162" className="fill-none stroke-primary/70" strokeWidth="3" strokeLinecap="round" />
    
    {/* Pencil */}
    <g transform="translate(130, 120) rotate(35)">
      {/* Pencil body */}
      <rect x="0" y="0" width="60" height="12" className="fill-accent" />
      {/* Pencil wood/tip */}
      <path d="M60 0 L75 6 L60 12 Z" className="fill-accent/60" />
      {/* Pencil point */}
      <path d="M72 4 L80 6 L72 8 Z" className="fill-foreground/70" />
      {/* Pencil eraser */}
      <rect x="-8" y="1" width="10" height="10" rx="1" className="fill-primary/60" />
      {/* Pencil metal band */}
      <rect x="-2" y="0" width="4" height="12" className="fill-foreground/30" />
    </g>
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
      title: "Track Matches & Build Fair Handicaps",
      description: "Record your matches and let the app calculate fair handicaps that improve over time.",
      illustration: <PaperPencilIllustration />,
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