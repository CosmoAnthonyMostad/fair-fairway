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

const ScorecardIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Scorecard shadow */}
    <rect x="15" y="45" width="170" height="110" rx="3" className="fill-foreground/10" transform="translate(3, 3)" />
    
    {/* Scorecard paper - landscape orientation like real scorecards */}
    <rect x="15" y="45" width="170" height="110" rx="3" className="fill-white" />
    <rect x="15" y="45" width="170" height="110" rx="3" className="fill-none stroke-foreground/20" strokeWidth="1.5" />
    
    {/* Course name header area */}
    <rect x="15" y="45" width="170" height="16" rx="3" className="fill-primary/15" />
    <text x="100" y="56" textAnchor="middle" className="fill-primary text-[8px] font-bold">PINE VALLEY GOLF CLUB</text>
    
    {/* Hole number row - header */}
    <rect x="15" y="61" width="25" height="12" className="fill-muted/60" />
    <text x="27" y="70" textAnchor="middle" className="fill-foreground/60 text-[6px] font-semibold">HOLE</text>
    
    {/* Hole numbers 1-9 */}
    {[1,2,3,4,5,6,7,8,9].map((num, i) => (
      <g key={num}>
        <rect x={40 + i * 16} y="61" width="16" height="12" className="fill-muted/40" />
        <text x={48 + i * 16} y="70" textAnchor="middle" className="fill-foreground/70 text-[7px] font-semibold">{num}</text>
      </g>
    ))}
    
    {/* Yardage row */}
    <rect x="15" y="73" width="25" height="11" className="fill-white" />
    <text x="27" y="81" textAnchor="middle" className="fill-foreground/50 text-[5px]">YDS</text>
    {[399, 307, 196, 141, 179, 213, 368, 79, 377].map((yds, i) => (
      <g key={i}>
        <rect x={40 + i * 16} y="73" width="16" height="11" className="fill-white" />
        <text x={48 + i * 16} y="81" textAnchor="middle" className="fill-foreground/40 text-[5px]">{yds}</text>
      </g>
    ))}
    
    {/* Par row */}
    <rect x="15" y="84" width="25" height="11" className="fill-primary/10" />
    <text x="27" y="92" textAnchor="middle" className="fill-primary/70 text-[5px] font-semibold">PAR</text>
    {[4, 4, 3, 3, 4, 4, 5, 3, 4].map((par, i) => (
      <g key={i}>
        <rect x={40 + i * 16} y="84" width="16" height="11" className="fill-primary/10" />
        <text x={48 + i * 16} y="92" textAnchor="middle" className="fill-primary text-[6px] font-semibold">{par}</text>
      </g>
    ))}
    
    {/* Handicap row */}
    <rect x="15" y="95" width="25" height="11" className="fill-white" />
    <text x="27" y="103" textAnchor="middle" className="fill-foreground/50 text-[5px]">HCP</text>
    {[3, 1, 9, 13, 7, 5, 11, 17, 15].map((hcp, i) => (
      <g key={i}>
        <rect x={40 + i * 16} y="95" width="16" height="11" className="fill-white" />
        <text x={48 + i * 16} y="103" textAnchor="middle" className="fill-foreground/40 text-[5px]">{hcp}</text>
      </g>
    ))}
    
    {/* Player 1 score row */}
    <rect x="15" y="106" width="25" height="14" className="fill-accent/10" />
    <text x="27" y="115" textAnchor="middle" className="fill-accent text-[5px] font-semibold">PLAYER</text>
    {[5, 4, 3, 4, 5, 4, 6, 3, 5].map((score, i) => (
      <g key={i}>
        <rect x={40 + i * 16} y="106" width="16" height="14" className="fill-accent/5" />
        <text x={48 + i * 16} y="116" textAnchor="middle" className="fill-foreground/80 text-[8px] font-semibold">{score}</text>
      </g>
    ))}
    
    {/* Player 2 score row */}
    <rect x="15" y="120" width="25" height="14" className="fill-primary/10" />
    <text x="27" y="129" textAnchor="middle" className="fill-primary text-[5px] font-semibold">PLAYER</text>
    {[4, 5, 4, 3, 4, 5, 5, 4, 4].map((score, i) => (
      <g key={i}>
        <rect x={40 + i * 16} y="120" width="16" height="14" className="fill-primary/5" />
        <text x={48 + i * 16} y="130" textAnchor="middle" className="fill-foreground/80 text-[8px] font-semibold">{score}</text>
      </g>
    ))}
    
    {/* Grid lines */}
    <line x1="40" y1="61" x2="40" y2="134" className="stroke-foreground/10" strokeWidth="0.5" />
    {[1,2,3,4,5,6,7,8,9].map((_, i) => (
      <line key={i} x1={56 + i * 16} y1="61" x2={56 + i * 16} y2="134" className="stroke-foreground/10" strokeWidth="0.5" />
    ))}
    
    {/* Out total box */}
    <rect x="15" y="134" width="25" height="12" className="fill-muted/60" />
    <text x="27" y="143" textAnchor="middle" className="fill-foreground/60 text-[6px] font-semibold">OUT</text>
    <rect x="40" y="134" width="144" height="12" className="fill-muted/30" />
    <text x="165" y="143" textAnchor="middle" className="fill-foreground/70 text-[7px] font-bold">39</text>
    
    {/* Pencil - angled across the card */}
    <g transform="translate(130, 95) rotate(20)">
      {/* Pencil body */}
      <rect x="0" y="0" width="55" height="9" className="fill-accent" />
      {/* Pencil wood/tip */}
      <path d="M55 0 L66 4.5 L55 9 Z" className="fill-accent/60" />
      {/* Pencil point */}
      <path d="M64 2.5 L72 4.5 L64 6.5 Z" className="fill-foreground/70" />
      {/* Pencil eraser */}
      <rect x="-6" y="1" width="7" height="7" rx="1" className="fill-primary/60" />
      {/* Pencil metal band */}
      <rect x="-1" y="0" width="3" height="9" className="fill-foreground/30" />
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
      illustration: <ScorecardIllustration />,
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
              <div className="flex-1 flex items-center justify-center bg-muted px-12 pt-safe">
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