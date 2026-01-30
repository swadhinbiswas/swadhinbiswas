import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// TYPES & QUOTES
// ============================================
type Action = 'idle' | 'walking' | 'looking' | 'celebrating' | 'sleeping' | 'weather' | 'emoji' | 'greeting' | 'teleporting' | 'appearing' | 'dancing' | 'spinning' | 'zooming' | 'dragged';
type Emotion = 'happy' | 'curious' | 'mischievous' | 'thinking' | 'excited' | 'sleepy' | 'neutral';

const QUOTES = {
    curious: ["Hmm, what's this?", "Ooh interesting!", "Let me see...", "🤔 Curious...", "What does this do?"],
    happy: ["Yay! 🎉", "This is fun!", "I love it here!", "*happy beeps*", "Wheeeee!", "So lovely! 💕"],
    mischievous: ["Hehe >:)", "Catch me!", "Over here now!", "*nom nom*", "Mine now!"],
    thinking: ["Hmm...", "Processing...", "*calculating*", "Let me think...", "🤖 beep boop"],
    excited: ["WOW!", "Amazing!", "So cool!", "OMG! 😲", "EPIC!", "Best day ever!"],
    greeting: ["Hi there! 👋", "Hello friend!", "Welcome! ✨", "Hey you!"],
    returning: ["You're back! 🎉", "Missed you!", "Welcome back!", "That refresh felt nice!"],
    teleport: ["🌀 Woooosh!", "Warping!", "See ya!", "Teleporting!", "Into the void!", "✨ Poof!"],
    appear: ["I'm here!", "Made it!", "That was fun!", "🌟 Ta-da!", "Landed!"],
    dancing: ["💃 Dance time!", "Groove mode!", "🎵🎶", "Let's boogie!"],
    spinning: ["Wheeeee!", "I'm dizzy!", "🌀", "Round and round!"],
    weather: ["Checking weather...", "Let me see outside!", "Weather report!"],
    sleeping: ["Zzz...", "*snore*", "💤", "So sleepy...", "5 more minutes..."],
    dragged: ["Whee!", "Flying!", "Whoa!", "Let go!"],
    zooming: ["ZOOM!", "Speed!", "Whoosh!", "💨"],
};

interface WeatherData {
    temp: number;
    code: number;
    description: string;
    aqi?: number;
    city?: string;
}

const getWeatherTip = (code: number, temp: number): string => {
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return "☔ Bring an umbrella!";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️ It's snowing! Stay warm!";
    if (temp >= 35) return "🥵 It's HOT! Drink lots of water!";
    if (temp >= 30) return "☀️ Stay hydrated friend!";
    if (temp <= 10) return "🥶 It's cold! Stay warm!";
    if (temp <= 5) return "❄️ Brrr! Bundle up!";
    return "Have a great day! 🌟";
};

const VISIT_KEY = 'pet_visited';

// ============================================
// MAIN COMPONENT
// ============================================
export default function FloatingPet() {
    // Physics & Position
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [vel, setVel] = useState({ x: 0, y: 0 });
    const [targetPos, setTargetPos] = useState<{ x: number, y: number } | null>(null);

    // Visual State
    const [action, setAction] = useState<Action>('idle');
    const [emotion, setEmotion] = useState<Emotion>('happy');
    const [message, setMessage] = useState<string | null>(null);
    const [facingRight, setFacingRight] = useState(true);
    const [blinkOpen, setBlinkOpen] = useState(true);

    // Black hole / Teleport states
    const [portalActive, setPortalActive] = useState(false);
    const [portalScale, setPortalScale] = useState(0);
    const [petScale, setPetScale] = useState(1);
    const [portalRotation, setPortalRotation] = useState(0);

    // Interactive State
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Look At (Eye Tracking)
    const [pupil, setPupil] = useState({ x: 0, y: 0 });

    // Effects
    const [sparkles, setSparkles] = useState<{ id: number, x: number, y: number, emoji: string, life: number }[]>([]);

    // Refs
    const petRef = useRef<HTMLDivElement>(null);
    const actionRef = useRef(action);
    const timeRef = useRef(0);
    const lastInteract = useRef(Date.now());
    const frameRef = useRef<number>(0);
    const hasGreeted = useRef(false);

    // Sync Action Ref
    useEffect(() => { actionRef.current = action; }, [action]);

    // ============================================
    // UTILS
    // ============================================
    const showQuote = useCallback((category: keyof typeof QUOTES, text?: string) => {
        if (text) setMessage(text);
        else {
            const list = QUOTES[category] || QUOTES.happy;
            setMessage(list[Math.floor(Math.random() * list.length)]);
        }
        setTimeout(() => setMessage(null), 3500);
    }, []);

    const addSparkle = useCallback((count = 1, type: 'star' | 'heart' = 'star') => {
        const emojis = type === 'heart' ? ['💕', '💖', '💗'] : ['✨', '⭐', '🌟'];
        const newS = Array.from({ length: count }).map(() => ({
            id: Math.random(),
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            life: 1.0
        }));
        setSparkles(prev => [...prev, ...newS]);
    }, []);

    const chaos = useCallback(() => Math.random(), []);

    const getRandomPosition = useCallback(() => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const padding = 100;
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
            x: padding + Math.random() * (w - padding * 2),
            y: padding + Math.random() * (h - padding * 2)
        };
    }, []);

    const fetchWeather = useCallback(async () => {
        try {
            const ipRes = await fetch('http://ip-api.com/json/?fields=lat,lon,city');
            const ipData = await ipRes.json();
            const { lat, lon, city } = ipData;
            if (!lat || !lon) throw new Error('No location');

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
            );
            const weatherData = await weatherRes.json();

            const codes: Record<number, string> = {
                0: 'Clear ☀️', 1: 'Clear 🌤️', 2: 'Cloudy ⛅', 3: 'Overcast ☁️',
                45: 'Foggy 🌫️', 51: 'Drizzle 🌧️', 61: 'Rain 🌧️', 65: 'Heavy Rain 🌧️',
                71: 'Snow ❄️', 95: 'Storm ⛈️',
            };

            return {
                temp: Math.round(weatherData.current.temperature_2m),
                code: weatherData.current.weather_code,
                description: codes[weatherData.current.weather_code] || 'Unknown',
                city
            } as WeatherData;
        } catch (e) {
            return null;
        }
    }, []);

    const fetchEmoji = useCallback(async () => {
        try {
            const res = await fetch('https://emojihub.yurace.pro/api/random');
            const data = await res.json();
            if (data.htmlCode && data.htmlCode[0]) {
                const emoji = String.fromCodePoint(parseInt(data.htmlCode[0].replace('&#', '').replace(';', '')));
                return emoji;
            }
        } catch (e) { }
        return '🌟';
    }, []);

    // ============================================
    // TELEPORTATION & ACTIONS
    // ============================================

    const teleport = useCallback(() => {
        if (actionRef.current === 'teleporting' || actionRef.current === 'appearing' || isDragging) return;

        setAction('teleporting');
        showQuote('teleport');
        setPortalActive(true);

        // Animation Sequence
        // 1. Shrink into portal
        let progress = 0;
        const animInterval = setInterval(() => {
            progress += 0.02;
            setPortalScale(Math.sin(progress * Math.PI) * 1.5);
            setPortalRotation(prev => prev + 15);
            setPetScale(Math.max(0, 1 - progress * 1.2));

            if (progress >= 0.8) {
                clearInterval(animInterval);

                // 2. Move (Instant)
                const newPos = getRandomPosition();
                setPos(newPos);

                // 3. Reappear
                setTimeout(() => {
                    setAction('appearing');
                    showQuote('appear');

                    let appearProgress = 0;
                    const appearInterval = setInterval(() => {
                        appearProgress += 0.08;
                        setPetScale(Math.min(1, appearProgress));
                        setPortalScale(Math.max(0, 1 - appearProgress));
                        setPortalRotation(prev => prev + 10);

                        if (appearProgress >= 1) {
                            clearInterval(appearInterval);
                            setPortalActive(false);
                            setPortalScale(0);
                            setPetScale(1);
                            setAction('idle');
                            addSparkle(5, 'star');
                        }
                    }, 30);
                }, 200);
            }
        }, 30);
    }, [isDragging, getRandomPosition, showQuote, addSparkle]);

    const doRandomAction = useCallback(async () => {
        if (actionRef.current !== 'idle' || isDragging || isHovered) return;

        const r = Math.random();
        // 5% Zoomies, 15% Weather, 15% Emoji, 15% Dance, 10% Spin, 40% Teleport/Nothing
        if (r < 0.05) {
            setAction('zooming');
            showQuote('zooming');
            setTimeout(() => setAction('idle'), 2500);
        } else if (r < 0.20) {
            setAction('weather');
            setEmotion('curious');
            showQuote('weather');
            const w = await fetchWeather();
            if (w) {
                setTimeout(() => showQuote('curious', `${w.temp}°C ${w.description} ${w.aqi ? `(AQI: ${w.aqi})` : ''}`), 1000);
                setTimeout(() => showQuote('happy', getWeatherTip(w.code, w.temp)), 4500);
            }
            setTimeout(() => setAction('idle'), 7000);
        } else if (r < 0.35) {
            setAction('emoji');
            setEmotion('excited');
            const e = await fetchEmoji();
            showQuote('excited', `Look! ${e}`);
            addSparkle(3);
            setTimeout(() => setAction('idle'), 3000);
        } else if (r < 0.50) {
            setAction('dancing');
            setEmotion('happy');
            showQuote('dancing');
            setTimeout(() => setAction('idle'), 3000);
        } else if (r < 0.60) {
            setAction('spinning');
            showQuote('spinning');
            setTimeout(() => setAction('idle'), 2000);
        } else if (r < 0.65) {
            teleport();
        }
    }, [isDragging, isHovered, fetchWeather, fetchEmoji, showQuote, addSparkle, teleport]);

    // ============================================
    // LOOPS & INIT
    // ============================================

    // Init & Greeting
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPos({ x: window.innerWidth - 150, y: window.innerHeight - 150 });

            const visited = localStorage.getItem(VISIT_KEY);
            setTimeout(() => {
                if (!hasGreeted.current) {
                    hasGreeted.current = true;
                    setAction('greeting');
                    setEmotion('happy');
                    showQuote(visited ? 'returning' : 'greeting');
                    if (!visited) localStorage.setItem(VISIT_KEY, 'true');
                    setTimeout(() => setAction('idle'), 4000);
                }
            }, 1000);
        }
    }, [showQuote]);

    // TELEPORT LOOP: Every 7 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Only teleport if idle, not dragging, and not already doing something specific
            if (actionRef.current === 'idle' && !isDragging && !isHovered) {
                teleport();
            }
        }, 7000);
        return () => clearInterval(interval);
    }, [teleport, isDragging, isHovered]);

    // Random Activity Loop (Less frequent now, for other stuff)
    useEffect(() => {
        const interval = setInterval(() => {
            doRandomAction();
        }, 5000); // Check every 5s for other small interactions
        return () => clearInterval(interval);
    }, [doRandomAction]);

    // Animation Loop
    useEffect(() => {
        let lastTime = performance.now();
        const loop = (t: number) => {
            const dt = Math.min((t - lastTime) / 1000, 0.1);
            lastTime = t;
            timeRef.current = t / 1000;

            const idleTime = Date.now() - lastInteract.current;
            // Sleep if idle for long (but teleport might interrupt, which is fine)
            if (actionRef.current === 'idle' && idleTime > 20000) {
                setAction('sleeping');
                setEmotion('sleepy');
                showQuote('sleeping');
            }

            setPos(prev => {
                let nextX = prev.x;
                let nextY = prev.y;

                if (actionRef.current === 'zooming') {
                    nextX += (Math.random() - 0.5) * 30;
                    nextY += (Math.random() - 0.5) * 30;
                    // Keep in bounds
                    if (nextX < 0) nextX += 50;
                    if (nextX > window.innerWidth) nextX -= 50;
                    if (nextY < 0) nextY += 50;
                    if (nextY > window.innerHeight) nextY -= 50;
                } else if (actionRef.current === 'idle' && !isDragging) {
                    nextY += Math.sin(t * 0.002) * 0.3;
                }
                return { x: nextX, y: nextY };
            });

            // Update Particles
            setSparkles(prev => prev.map(s => ({ ...s, y: s.y - 0.5, life: s.life - 0.02 })).filter(s => s.life > 0));

            frameRef.current = requestAnimationFrame(loop);
        };
        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [isDragging]);

    // Mouse Tracking
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!petRef.current) return;
            const rect = petRef.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            setPupil({
                x: Math.max(-3, Math.min(3, (e.clientX - cx) / 30)),
                y: Math.max(-3, Math.min(3, (e.clientY - cy) / 30))
            });

            if (isDragging) {
                setPos({ x: e.clientX, y: e.clientY });
            }
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [isDragging]);

    // Hover/Drag Handlers
    const handleMouseDown = () => {
        setIsDragging(true);
        setAction('dragged');
        setEmotion('excited');
        showQuote('dragged');
        lastInteract.current = Date.now();
    };
    const handleMouseUp = () => {
        setIsDragging(false);
        setAction('idle');
    };
    const handleHover = () => {
        setIsHovered(true);
        lastInteract.current = Date.now();
        if (action === 'sleeping') {
            setAction('idle');
            showQuote('curious');
        } else {
            setEmotion('happy');
            if (Math.random() > 0.7) showQuote('happy');
        }
    };

    // Blinking
    useEffect(() => {
        const int = setInterval(() => {
            setBlinkOpen(false);
            setTimeout(() => setBlinkOpen(true), 150);
        }, 4000);
        return () => clearInterval(int);
    }, []);

    // Render Transforms
    const isSleeping = action === 'sleeping';
    const isZooming = action === 'zooming';
    const isDancing = action === 'dancing';
    const breathe = isSleeping ? Math.sin(timeRef.current) * 0.02 : Math.sin(timeRef.current * 3) * 0.05;
    const rotation = action === 'spinning' ? (timeRef.current * 1000) % 360 : 0;
    const scale = isZooming ? 0.8 : 1 + breathe;

    return (
        <div
            ref={petRef}
            className="fixed z-[60] cursor-grab active:cursor-grabbing select-none hidden md:block"
            style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                transition: (isDragging || action === 'teleporting') ? 'none' : 'transform 0.1s linear, left 0.1s linear, top 0.1s linear'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleHover}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* BLACK HOLE PORTAL */}
            {portalActive && (
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                        transform: `translate(-50%, -50%) scale(${portalScale}) rotate(${portalRotation}deg)`,
                        zIndex: -1
                    }}
                >
                    <svg width="150" height="150" viewBox="0 0 120 120">
                        <defs>
                            <radialGradient id="portalGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#000000" />
                                <stop offset="70%" stopColor="#1a1a1a" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <circle cx="60" cy="60" r="50" fill="url(#portalGrad)" />
                        <circle cx="60" cy="60" r="40" fill="none" stroke="#262626" strokeWidth="2" strokeDasharray="10 5" className="animate-spin" />
                    </svg>
                </div>
            )}

            {/* Sparkles */}
            {sparkles.map(s => (
                <div key={s.id} className="absolute pointer-events-none"
                    style={{
                        left: `calc(50% + ${s.x}px)`,
                        top: `calc(50% + ${s.y}px)`,
                        opacity: s.life,
                        transform: `scale(${s.life})`
                    }}>
                    {s.emoji}
                </div>
            ))}

            {/* Message Bubble */}
            {message && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-white/90 rounded-2xl text-sm font-bold text-indigo-600 shadow-xl whitespace-nowrap animate-bounce z-50 border-2 border-indigo-100">
                    {message}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/90"></div>
                </div>
            )}

            {/* Sleep Zzz */}
            {isSleeping && <div className="absolute -top-6 right-0 text-indigo-400 font-bold animate-pulse text-xl">Zzz...</div>}

            {/* ROBOT SVG */}
            <svg width="70" height="80" viewBox="0 0 100 120" className="drop-shadow-2xl" style={{ transform: `scale(${petScale})` }}>
                <defs>
                    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#e0e7ff" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* Jetpack Flame */}
                {(!isSleeping || isZooming) && (
                    <path d="M40 100 Q50 120 60 100" fill="#f59e0b" className="animate-pulse" opacity="0.8" />
                )}

                {/* Body */}
                <rect x="25" y="40" width="50" height="60" rx="15" fill="url(#metal)" stroke="#4338ca" strokeWidth="2" />

                {/* Belly Screen */}
                <rect x="35" y="65" width="30" height="25" rx="5" fill="#1e1b4b" />
                <path d="M50 82 l-4 -4 a3 3 0 0 1 4 -4 a3 3 0 0 1 4 4 z" fill={emotion === 'happy' ? '#f472b6' : '#4338ca'} className={emotion === 'happy' ? 'animate-ping' : ''} />

                {/* Head */}
                <path d="M20 40 Q50 10 80 40 L80 50 L20 50 Z" fill="url(#metal)" stroke="#4338ca" strokeWidth="2" />

                {/* Antenna */}
                <line x1="50" y1="25" x2="50" y2="10" stroke="#4338ca" strokeWidth="2" />
                <circle cx="50" cy="10" r="4" fill="#ef4444" className={(!isSleeping) ? "animate-pulse" : ""} />

                {/* Face Screen */}
                <rect x="30" y="30" width="40" height="20" rx="8" fill="#0f172a" />

                {/* EYES */}
                {isSleeping ? (
                    <g stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
                        <path d="M38 40 L45 40" />
                        <path d="M55 40 L62 40" />
                    </g>
                ) : (
                    <g fill="#22d3ee" filter="url(#glow)">
                        <circle cx={40 + pupil.x} cy={40 + pupil.y} r={(emotion === 'excited' || action === 'zooming' || action === 'celebrating') ? 5 : 3.5} />
                        <circle cx={60 + pupil.x} cy={40 + pupil.y} r={(emotion === 'excited' || action === 'zooming' || action === 'celebrating') ? 5 : 3.5} />
                    </g>
                )}

                {/* Arms */}
                <path d="M25 55 Q10 70 25 85" fill="none" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" className={isDancing ? "animate-spin" : ""} />
                <path d="M75 55 Q90 70 75 85" fill="none" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" className={isDancing ? "animate-spin" : ""} />
            </svg>
        </div>
    );
}
