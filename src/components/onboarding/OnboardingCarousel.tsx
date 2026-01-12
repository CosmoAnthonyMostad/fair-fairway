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
    
    {/* Golf bag in background */}
    <rect x="25" y="100" width="18" height="70" rx="4" className="fill-foreground/20" />
    <rect x="28" y="95" width="12" height="10" rx="2" className="fill-foreground/15" />
    <line x1="30" y1="95" x2="30" y2="75" className="stroke-foreground/30" strokeWidth="2" />
    <line x1="36" y1="95" x2="38" y2="70" className="stroke-foreground/25" strokeWidth="2" />
    <line x1="33" y1="95" x2="32" y2="68" className="stroke-foreground/20" strokeWidth="2" />
    
    {/* Golfer head */}
    <circle cx="105" cy="48" r="22" className="fill-primary" />
    {/* Golfer cap */}
    <ellipse cx="105" cy="35" rx="20" ry="8" className="fill-primary-dark" />
    <rect x="85" y="30" width="40" height="8" rx="2" className="fill-primary-dark" />
    <rect x="100" y="26" width="25" height="6" rx="1" className="fill-primary-dark" />
    
    {/* Golfer torso */}
    <path d="M80 70 L85 125 L125 125 L130 70 Z" className="fill-primary" />
    {/* Polo collar */}
    <path d="M92 70 L105 80 L118 70" className="fill-none stroke-primary-dark" strokeWidth="3" />
    {/* Arm holding club */}
    <path d="M130 80 Q150 75 155 55" className="fill-none stroke-primary" strokeWidth="12" strokeLinecap="round" />
    <circle cx="155" cy="55" r="8" className="fill-primary" />
    
    {/* Golfer legs */}
    <path d="M90 125 L82 175 L95 175 L100 125" className="fill-foreground/70" />
    <path d="M110 125 L118 175 L131 175 L120 125" className="fill-foreground/70" />
    {/* Shoes */}
    <ellipse cx="88" cy="178" rx="10" ry="5" className="fill-foreground/80" />
    <ellipse cx="124" cy="178" rx="10" ry="5" className="fill-foreground/80" />
    
    {/* Golf club */}
    <line x1="155" y1="55" x2="165" y2="165" className="stroke-foreground/60" strokeWidth="3" strokeLinecap="round" />
    <path d="M160 160 L175 170 L172 175 L158 168 Z" className="fill-foreground/70" />
    
    {/* Golf ball */}
    <circle cx="175" cy="175" r="8" className="fill-white" />
    <circle cx="173" cy="173" r="1.5" className="fill-foreground/20" />
    <circle cx="177" cy="176" r="1" className="fill-foreground/20" />
    <circle cx="175" cy="178" r="1.2" className="fill-foreground/20" />
    
    {/* Flag in distance */}
    <rect x="50" y="110" width="2" height="45" className="fill-foreground/40" />
    <path d="M52 110 L52 125 L68 117.5 Z" className="fill-accent" />
    <ellipse cx="51" cy="155" rx="8" ry="3" className="fill-primary/30" />
  </svg>
);

const FriendsIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Ground */}
    <ellipse cx="100" cy="188" rx="85" ry="10" className="fill-primary/20" />
    
    {/* Left person */}
    <circle cx="65" cy="55" r="20" className="fill-primary" />
    {/* Hair/cap */}
    <path d="M45 50 Q55 35 75 40 Q85 50 85 55 L45 55 Z" className="fill-primary-dark" />
    {/* Body */}
    <path d="M45 78 L48 135 L82 135 L85 78 Z" className="fill-primary" />
    {/* Arms - waving */}
    <path d="M45 85 Q30 80 25 65" className="fill-none stroke-primary" strokeWidth="10" strokeLinecap="round" />
    <circle cx="25" cy="65" r="6" className="fill-primary" />
    <path d="M85 90 Q95 95 100 105" className="fill-none stroke-primary" strokeWidth="10" strokeLinecap="round" />
    {/* Legs */}
    <rect x="52" y="135" width="12" height="40" rx="4" className="fill-foreground/70" />
    <rect x="68" y="135" width="12" height="40" rx="4" className="fill-foreground/70" />
    {/* Shoes */}
    <ellipse cx="58" cy="178" rx="9" ry="5" className="fill-foreground/80" />
    <ellipse cx="74" cy="178" rx="9" ry="5" className="fill-foreground/80" />
    
    {/* Right person */}
    <circle cx="135" cy="55" r="20" className="fill-accent" />
    {/* Hair */}
    <path d="M120 45 Q135 30 150 45 Q155 55 150 60 L120 60 Q115 55 120 45" className="fill-accent/70" />
    {/* Body */}
    <path d="M115 78 L118 135 L152 135 L155 78 Z" className="fill-accent" />
    {/* Arms */}
    <path d="M115 90 Q105 95 100 105" className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round" />
    <path d="M155 85 Q170 80 175 70" className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round" />
    <circle cx="175" cy="70" r="6" className="fill-accent" />
    {/* Legs */}
    <rect x="122" y="135" width="12" height="40" rx="4" className="fill-foreground/60" />
    <rect x="138" y="135" width="12" height="40" rx="4" className="fill-foreground/60" />
    {/* Shoes */}
    <ellipse cx="128" cy="178" rx="9" ry="5" className="fill-foreground/70" />
    <ellipse cx="144" cy="178" rx="9" ry="5" className="fill-foreground/70" />
    
    {/* Connection - high five effect */}
    <circle cx="100" cy="105" r="12" className="fill-accent/30" />
    <circle cx="100" cy="105" r="8" className="fill-primary/40" />
    {/* Sparkles around high five */}
    <circle cx="90" cy="95" r="2" className="fill-accent/60" />
    <circle cx="110" cy="98" r="2.5" className="fill-primary/60" />
    <circle cx="95" cy="115" r="2" className="fill-primary/50" />
    <circle cx="108" cy="112" r="1.5" className="fill-accent/50" />
    
    {/* Golf balls at feet */}
    <circle cx="42" cy="182" r="5" className="fill-white" />
    <circle cx="160" cy="182" r="5" className="fill-white" />
  </svg>
);

const TrophyIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Pedestal/base shadow */}
    <ellipse cx="100" cy="185" rx="70" ry="10" className="fill-foreground/10" />
    
    {/* Trophy cup */}
    <path d="M60 45 L68 105 L132 105 L140 45 Z" className="fill-accent" />
    <ellipse cx="100" cy="45" rx="40" ry="10" className="fill-accent" />
    {/* Inner cup shadow */}
    <ellipse cx="100" cy="48" rx="30" ry="7" className="fill-accent/70" />
    
    {/* Trophy handles - more detailed */}
    <path d="M58 55 C25 55 20 90 55 100" className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round" />
    <path d="M142 55 C175 55 180 90 145 100" className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round" />
    {/* Handle inner detail */}
    <path d="M55 60 C35 60 32 85 52 92" className="fill-none stroke-accent/50" strokeWidth="4" strokeLinecap="round" />
    <path d="M145 60 C165 60 168 85 148 92" className="fill-none stroke-accent/50" strokeWidth="4" strokeLinecap="round" />
    
    {/* Trophy neck */}
    <rect x="88" y="105" width="24" height="25" className="fill-primary" />
    {/* Decorative rings on neck */}
    <rect x="85" y="108" width="30" height="4" rx="1" className="fill-primary-dark" />
    <rect x="85" y="122" width="30" height="4" rx="1" className="fill-primary-dark" />
    
    {/* Trophy base layers */}
    <rect x="72" y="130" width="56" height="12" rx="3" className="fill-primary" />
    <rect x="65" y="142" width="70" height="10" rx="3" className="fill-primary-dark" />
    <rect x="58" y="152" width="84" height="14" rx="4" className="fill-foreground/80" />
    {/* Base plate */}
    <rect x="55" y="166" width="90" height="8" rx="2" className="fill-foreground/60" />
    
    {/* Star on trophy */}
    <path d="M100 58 L104 70 L117 70 L107 78 L111 91 L100 83 L89 91 L93 78 L83 70 L96 70 Z" className="fill-white" />
    
    {/* Number 1 */}
    <text x="100" y="162" textAnchor="middle" className="fill-white font-bold text-sm" style={{ fontSize: '10px' }}>1st</text>
    
    {/* Sparkles and celebration */}
    <circle cx="35" cy="40" r="4" className="fill-accent/50" />
    <circle cx="165" cy="35" r="5" className="fill-primary/50" />
    <circle cx="170" cy="120" r="3" className="fill-accent/40" />
    <circle cx="25" cy="110" r="4" className="fill-primary/40" />
    <circle cx="45" cy="70" r="2.5" className="fill-accent/60" />
    <circle cx="160" cy="75" r="3" className="fill-primary/60" />
    
    {/* Confetti pieces */}
    <rect x="30" y="55" width="6" height="3" rx="1" className="fill-primary/50" transform="rotate(25 33 56)" />
    <rect x="165" y="50" width="6" height="3" rx="1" className="fill-accent/50" transform="rotate(-20 168 51)" />
    <rect x="40" y="130" width="5" height="2.5" rx="1" className="fill-accent/40" transform="rotate(15 42 131)" />
    <rect x="155" y="135" width="5" height="2.5" rx="1" className="fill-primary/40" transform="rotate(-30 157 136)" />
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