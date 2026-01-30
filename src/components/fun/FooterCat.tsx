import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// MOCHI - Super Cute Interactive Cat
// ============================================
type CatAction = 'idle' | 'walking' | 'sleeping' | 'excited' | 'grooming' | 'stretching' | 'backflip' | 'football' | 'pouncing';

const CAT_QUOTES = {
    happy: ["Purr~ 💕", "Nya~!", "Mew!", "♡"],
    curious: ["Hmm?", "*sniff*", "?"],
    playful: ["Play!", "*pounce*", "Wee!"],
    sleepy: ["Zzz...", "*yawn*"],
    petting: ["Purr~", "Nice!", "*purr*"],
    clicked: ["Nya!", "Boop!", "Mew!"],
    backflip: ["Woohoo!", "Yay!", "✨"],
    football: ["Goal! ⚽", "Score!"],
};

export default function FooterCat() {
    // Position
    const [posX, setPosX] = useState(50);
    const [targetX, setTargetX] = useState(50);
    const [facingRight, setFacingRight] = useState(true);

    // Animation
    const [walkFrame, setWalkFrame] = useState(0);
    const [_flipAngle] = useState(0); // unused, kept for potential future use
    const [jumpY, setJumpY] = useState(0);
    const [ballX, setBallX] = useState(0);
    const [ballY, setBallY] = useState(0);

    // State
    const [action, setAction] = useState<CatAction>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [particles, setParticles] = useState<{ id: number, x: number, emoji: string }[]>([]);

    // Eyes - smaller and interactive
    const [eyesOpen, setEyesOpen] = useState(true);
    const [pupilX, setPupilX] = useState(0);
    const [pupilY, setPupilY] = useState(0);

    // Tail & Ears
    const [tailWag, setTailWag] = useState(0);
    const [earTwitch, setEarTwitch] = useState(0);

    // Interaction
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [happiness, setHappiness] = useState(50);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const particleId = useRef(0);
    const posRef = useRef(posX);
    useEffect(() => { posRef.current = posX; }, [posX]);

    // ============================================
    // EYE BLINKING (random intervals)
    // ============================================
    useEffect(() => {
        const blink = () => {
            setEyesOpen(false);
            setTimeout(() => setEyesOpen(true), 100);
        };
        const interval = setInterval(blink, 2500 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // EYE TRACKING (follows cursor)
    // ============================================
    useEffect(() => {
        const track = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const catX = rect.left + rect.width * (posRef.current / 100);
            const catY = rect.top + 20;
            const dx = (e.clientX - catX) / 80;
            const dy = (e.clientY - catY) / 80;
            setPupilX(Math.max(-1.5, Math.min(1.5, dx)));
            setPupilY(Math.max(-1, Math.min(1, dy)));
        };
        window.addEventListener('mousemove', track);
        return () => window.removeEventListener('mousemove', track);
    }, []);

    // ============================================
    // TAIL WAGGING
    // ============================================
    useEffect(() => {
        const interval = setInterval(() => {
            setTailWag(prev => prev + 0.15);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // EAR TWITCH
    // ============================================
    useEffect(() => {
        const twitch = () => {
            setEarTwitch(Math.random() > 0.5 ? 3 : -3);
            setTimeout(() => setEarTwitch(0), 120);
        };
        const interval = setInterval(twitch, 4000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // PARTICLES
    // ============================================
    const addParticle = useCallback((emoji: string) => {
        const id = particleId.current++;
        setParticles(prev => [...prev, { id, x: posRef.current + (Math.random() - 0.5) * 15, emoji }]);
        setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 1000);
    }, []);

    // ============================================
    // QUOTES
    // ============================================
    const showQuote = useCallback((category: keyof typeof CAT_QUOTES) => {
        const quotes = CAT_QUOTES[category];
        setMessage(quotes[Math.floor(Math.random() * quotes.length)]);
        setTimeout(() => setMessage(null), 1800);
    }, []);

    // ============================================
    // SIMPLE CUTE JUMP (no rotation)
    // ============================================
    const doJump = useCallback(() => {
        if (action !== 'idle') return;
        setAction('backflip'); // reuse state
        showQuote('backflip');

        const duration = 400; // ms - quick jump
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Simple jump arc (up then down) - no rotation!
            const jumpHeight = 25;
            setJumpY(Math.sin(progress * Math.PI) * jumpHeight);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Landing
                setJumpY(0);
                setAction('idle');
                addParticle('✨');
            }
        };
        requestAnimationFrame(animate);
    }, [action, showQuote, addParticle]);

    // ============================================
    // FOOTBALL
    // ============================================
    const playFootball = useCallback(() => {
        if (action !== 'idle') return;
        setAction('football');
        showQuote('football');

        let frame = 0;
        const kick = setInterval(() => {
            frame++;
            setBallX(frame * 3);
            setBallY(Math.abs(Math.sin(frame * 0.35)) * 15);
            if (frame > 20) {
                clearInterval(kick);
                setBallX(0);
                setBallY(0);
                setAction('idle');
            }
        }, 40);
    }, [action, showQuote]);

    // ============================================
    // POUNCE
    // ============================================
    const doPounce = useCallback(() => {
        if (action !== 'idle') return;
        setAction('pouncing');
        const dir = Math.random() > 0.5 ? 1 : -1;
        const newTarget = Math.max(10, Math.min(90, posRef.current + dir * 18));
        setFacingRight(dir > 0);
        setTargetX(newTarget);
        setTimeout(() => setAction('idle'), 400);
    }, [action]);

    // ============================================
    // MOVEMENT - Fixed direction!
    // ============================================
    const walkTo = useCallback((x: number) => {
        const clampedX = Math.max(8, Math.min(92, x));
        const current = posRef.current;
        // FIX: Set direction BEFORE walking
        setFacingRight(clampedX > current);
        setTargetX(clampedX);
        setAction('walking');
    }, []);

    const randomWalk = useCallback(() => {
        walkTo(Math.random() * 80 + 10);
    }, [walkTo]);

    // Movement animation
    useEffect(() => {
        const interval = setInterval(() => {
            setPosX(prev => {
                const diff = targetX - prev;
                if (Math.abs(diff) < 0.4) {
                    if (action === 'walking') setAction('idle');
                    return targetX;
                }
                if (action === 'walking') {
                    setWalkFrame(f => (f + 1) % 12);
                }
                return prev + diff * 0.025; // Slow walk
            });
        }, 35);
        return () => clearInterval(interval);
    }, [targetX, action]);

    // ============================================
    // INTERACTIONS
    // ============================================
    const handleClick = useCallback(() => {
        if (isDragging) return;
        const r = Math.random();
        if (r < 0.3) doJump();
        else if (r < 0.5) playFootball();
        else if (r < 0.65) doPounce();
        else {
            setAction('excited');
            showQuote('clicked');
            addParticle('💕');
            setTimeout(() => setAction('idle'), 500);
        }
    }, [isDragging, doJump, playFootball, doPounce, showQuote, addParticle]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        setHappiness(prev => Math.min(100, prev + 3));
        showQuote('petting');
        addParticle('💕');
    }, [showQuote, addParticle]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    // Drag
    const handleDragStart = useCallback(() => setIsDragging(true), []);
    const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const rect = containerRef.current.getBoundingClientRect();
        const newX = ((clientX - rect.left) / rect.width) * 100;
        const clampedX = Math.max(5, Math.min(95, newX));
        // Fix direction while dragging
        setFacingRight(clampedX > posRef.current);
        setPosX(clampedX);
        setTargetX(clampedX);
    }, [isDragging]);
    const handleDragEnd = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDrag);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDrag);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDrag, handleDragEnd]);

    // ============================================
    // RANDOM BEHAVIORS
    // ============================================
    useEffect(() => {
        const interval = setInterval(() => {
            if (action === 'idle' && !isDragging && !isHovered) {
                const r = Math.random();
                if (r < 0.35) randomWalk();
                else if (r < 0.45) doJump();
                else if (r < 0.55) playFootball();
                else if (r < 0.65) doPounce();
                else if (r < 0.8) {
                    setAction('grooming');
                    setTimeout(() => setAction('idle'), 1500);
                } else {
                    setAction('stretching');
                    setTimeout(() => setAction('idle'), 1200);
                }
            }
        }, 4500);
        return () => clearInterval(interval);
    }, [action, isDragging, isHovered, randomWalk, doJump, playFootball, doPounce]);

    // Persistence
    useEffect(() => {
        try {
            const saved = localStorage.getItem('mochi_happiness');
            if (saved) setHappiness(Number(saved) || 50);
        } catch { }
    }, []);
    useEffect(() => {
        localStorage.setItem('mochi_happiness', String(happiness));
    }, [happiness]);

    // ============================================
    // COMPUTED
    // ============================================
    const isWalking = action === 'walking';
    const isSleeping = action === 'sleeping';
    const legMove = isWalking ? Math.sin(walkFrame * 0.5) * 2.5 : 0;
    const bodyBob = isWalking ? Math.sin(walkFrame * 0.25) * 1 : 0;
    const tailSwing = Math.sin(tailWag) * (isHovered || isWalking ? 18 : 10);

    return (
        <div ref={containerRef} className="relative w-full h-14 overflow-visible pointer-events-auto" style={{ zIndex: 100 }}>
            {/* Particles */}
            {particles.map(p => (
                <div key={p.id} className="absolute pointer-events-none text-sm"
                    style={{ left: `${p.x}%`, bottom: '100%', animation: 'floatUp 1s ease-out forwards' }}>
                    {p.emoji}
                </div>
            ))}

            {/* Football */}
            {action === 'football' && ballX > 0 && (
                <div className="absolute text-base" style={{
                    left: `calc(${posX}% + ${facingRight ? ballX : -ballX}px)`,
                    bottom: `${8 + ballY}px`,
                    transform: `rotate(${ballX * 6}deg)`,
                }}>⚽</div>
            )}

            {/* Cat Container */}
            <div
                className="absolute bottom-0 cursor-grab active:cursor-grabbing"
                style={{
                    left: `${posX}%`,
                    // FIX: Invert scaleX - cat SVG faces LEFT, so facingRight needs scaleX(-1)
                    transform: `translateX(-50%) scaleX(${facingRight ? -1 : 1}) translateY(${-bodyBob - jumpY}px)`,
                    transformOrigin: 'center bottom',
                }}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                {/* Message */}
                {message && (
                    <div className="absolute bottom-full left-1/2 mb-1 px-1.5 py-0.5 bg-white/90 border border-pink-200 rounded-md text-[8px] text-pink-600 shadow whitespace-nowrap"
                        style={{ transform: `translateX(-50%) scaleX(${facingRight ? -1 : 1})` }}>
                        {message}
                    </div>
                )}

                {/* Hover heart */}
                {isHovered && <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] animate-ping">💕</div>}

                {/* ========== PERSIAN CAT SVG - Super Fluffy & Cute ========== */}
                <svg
                    width="52"
                    height="46"
                    viewBox="0 0 100 90"
                    className={action === "excited" ? "animate-bounce" : ""}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Base Persian fur */}
                        <linearGradient id="persianFur" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fffdfa" />
                            <stop offset="55%" stopColor="#f3e3d9" />
                            <stop offset="100%" stopColor="#e2cfc3" />
                        </linearGradient>

                        <radialGradient id="faceFur" cx="40%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="60%" stopColor="#f5e6dc" />
                            <stop offset="100%" stopColor="#e2cfc3" />
                        </radialGradient>

                        <radialGradient id="cheekFur">
                            <stop offset="0%" stopColor="#fff8f3" />
                            <stop offset="100%" stopColor="#e8d4c8" />
                        </radialGradient>

                        <radialGradient id="irisGradient">
                            <stop offset="0%" stopColor="#6b4a3a" />
                            <stop offset="100%" stopColor="#3e2b22" />
                        </radialGradient>
                    </defs>

                    {/* ===== TAIL ===== */}
                    <g>
                        <path
                            d={`M82 56
        Q${95 + tailSwing} ${36 - Math.abs(tailSwing / 2)} ${92 + tailSwing / 2} 14
        Q${90 + tailSwing / 3} 4 ${85 + tailSwing / 4} 8
        Q80 16 82 36
        Q84 50 82 56`}
                            fill="url(#persianFur)"
                            stroke="#d4c0b4"
                            strokeWidth="0.5"
                        />
                        <path
                            d={`M86 ${22 + tailSwing / 4}
        Q${92 + tailSwing / 3} 20 ${88 + tailSwing / 4} 30`}
                            stroke="#ead8cc"
                            strokeWidth="2"
                            opacity="0.5"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </g>

                    {/* ===== BODY ===== */}
                    <ellipse cx="52" cy="62" rx="30" ry="22" fill="url(#persianFur)" />
                    <ellipse cx="46" cy="56" rx="18" ry="14" fill="#fff" opacity="0.35" />

                    {/* Fur texture */}
                    <path
                        d="M30 54 Q38 48 46 54"
                        stroke="#ead8cc"
                        strokeWidth="1.3"
                        opacity="0.4"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* ===== LEGS ===== */}
                    <g style={{ transform: `translateY(${-legMove}px)` }}>
                        <ellipse cx="72" cy="74" rx="12" ry="14" fill="url(#persianFur)" />
                        <ellipse cx="74" cy="86" rx="9" ry="5" fill="#fff" opacity="0.5" />
                    </g>

                    <g style={{ transform: `translateY(${legMove}px)` }}>
                        <rect x="28" y="70" width="12" height="16" rx="6" fill="url(#persianFur)" />
                        <ellipse cx="34" cy="85" rx="7" ry="4" fill="#fff" opacity="0.5" />
                        <rect x="44" y="70" width="12" height="16" rx="6" fill="url(#persianFur)" />
                        <ellipse cx="50" cy="85" rx="7" ry="4" fill="#fff" opacity="0.5" />
                    </g>

                    {/* ===== HEAD ===== */}
                    <ellipse cx="42" cy="36" rx="27" ry="26" fill="url(#faceFur)" />

                    {/* Cheeks (asymmetrical) */}
                    <ellipse cx="21.5" cy="43" rx="11" ry="9" fill="url(#cheekFur)" opacity="0.85" />
                    <ellipse cx="63" cy="41.5" rx="10" ry="8.5" fill="url(#cheekFur)" opacity="0.85" />

                    {/* Cheek fluff */}
                    <path
                        d="M18 44 Q12 50 18 58"
                        stroke="#e6d2c6"
                        strokeWidth="2"
                        opacity="0.5"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M66 42 Q72 48 66 56"
                        stroke="#e6d2c6"
                        strokeWidth="2"
                        opacity="0.5"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* ===== EARS ===== */}
                    <path
                        d={`M18 ${22 + earTwitch}
      Q20 6 32 16
      Q28 22 20 26 Z`}
                        fill="url(#persianFur)"
                    />
                    <path
                        d={`M66 ${22 - earTwitch}
      Q64 6 52 16
      Q56 22 64 26 Z`}
                        fill="url(#persianFur)"
                    />
                    <path d="M22 20 Q23 12 30 17" fill="#ffc8c8" opacity="0.6" />
                    <path d="M62 20 Q61 12 54 17" fill="#ffc8c8" opacity="0.6" />

                    {/* ===== EYES ===== */}
                    {isSleeping || !eyesOpen ? (
                        <>
                            <path d="M30 36 Q36 30 42 36" stroke="#5a4842" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <path d="M42 36 Q48 30 54 36" stroke="#5a4842" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        </>
                    ) : (
                        <>
                            {/* Eye whites */}
                            <ellipse cx="33.5" cy="35.5" rx="8.5" ry="9.5" fill="#fff" />
                            <ellipse cx="51.5" cy="34.5" rx="8.5" ry="9.5" fill="#fff" />

                            {/* Iris */}
                            <ellipse cx={33.5 + pupilX} cy={35.5 + pupilY} rx="4.6" ry="5" fill="url(#irisGradient)" />
                            <ellipse cx={51.5 + pupilX} cy={34.5 + pupilY} rx="4.6" ry="5" fill="url(#irisGradient)" />

                            {/* Pupil */}
                            <ellipse cx={33.5 + pupilX} cy={35.5 + pupilY} rx="1.6" ry="3.2" fill="#1f1410" />
                            <ellipse cx={51.5 + pupilX} cy={34.5 + pupilY} rx="1.6" ry="3.2" fill="#1f1410" />

                            {/* Sparkles */}
                            <circle cx={31.5 + pupilX * 0.4} cy={32 + pupilY * 0.4} r="2" fill="#fff" />
                            <circle cx={49.5 + pupilX * 0.4} cy={31 + pupilY * 0.4} r="2" fill="#fff" />
                        </>
                    )}

                    {/* ===== NOSE & MOUTH ===== */}
                    <ellipse cx="42" cy="47.5" rx="4.2" ry="2.8" fill="#ffb3b3" />
                    <ellipse cx="42" cy="46.8" rx="2.2" ry="1.3" fill="#ffd1d1" opacity="0.6" />

                    <path d="M42 50 L42 53" stroke="#9a7a70" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M36 55 Q42 60 48 55" stroke="#9a7a70" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    {/* ===== WHISKERS ===== */}
                    <g stroke="#c8b8a8" strokeWidth="0.7" opacity="0.5">
                        <line x1="8" y1="44" x2="22" y2="46" />
                        <line x1="6" y1="50" x2="22" y2="50" />
                        <line x1="8" y1="56" x2="22" y2="54" />
                        <line x1="76" y1="44" x2="62" y2="46" />
                        <line x1="78" y1="50" x2="62" y2="50" />
                        <line x1="76" y1="56" x2="62" y2="54" />
                    </g>
                </svg>


                {/* Name */}
                <div className="absolute -bottom-2 left-1/2 text-[6px] text-pink-500/50"
                    style={{ transform: `translateX(-50%) scaleX(${facingRight ? -1 : 1})` }}>
                    Mochi
                </div>
            </div>

            {/* Happiness meter */}
            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 opacity-25 hover:opacity-100 transition-opacity">
                <span className="text-[7px]">💕</span>
                <div className="w-6 h-0.5 bg-pink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400" style={{ width: `${happiness}%` }} />
                </div>
            </div>

            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-20px) scale(0.6); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
