import React, { useState, useEffect, useRef } from 'react';

export default function GlobalClicker() {
    const [count, setCount] = useState<number | null>(null);
    const [hacking, setHacking] = useState(false);
    const [added, setAdded] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch initial count and poll every 5 seconds
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/clicks');
                const data = await res.json();
                if (typeof data.count === 'number') {
                    // Only update if we are not actively clicking (to avoid jumping)
                    // or if the difference is huge (someone else clicked)
                    setCount(prev => {
                        if (prev === null) return data.count;
                        // If we have local pending additions, don't override immediately unless significant
                        return Math.max(prev, data.count);
                    });
                }
            } catch (e) {
                console.error("Failed to fetch global hacks", e);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 5000); // Poll every 5s

        return () => clearInterval(interval);
    }, []);

    const handleHack = async () => {
        // Optimistic UI update
        setCount(prev => (prev || 0) + 1);
        setAdded(prev => prev + 1);
        setHacking(true);

        // Reset hacking animation state
        setTimeout(() => setHacking(false), 100);

        // Debounce the actual API call
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                await fetch('/api/clicks', { method: 'POST' });
                // We could manually re-fetch here, but the polling will catch it eventually
            } catch (e) {
                console.error("Hack failed", e);
            }
        }, 300); // 300ms debounce
    };

    if (count === null) return null; // Loading state (invisible)

    return (
        <div className="flex items-center gap-4 bg-black/40 border border-neon-cyan/30 rounded-lg px-4 py-2 font-mono">
            <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Global Hacks</span>
                <span className="text-xl font-bold text-neon-cyan tabular-nums drop-shadow-[0_0_5px_rgba(4,217,255,0.6)]">
                    {count.toLocaleString()}
                </span>
            </div>

            <button
                onClick={handleHack}
                className={`
          relative overflow-hidden px-4 py-2 rounded bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan font-bold uppercase text-xs tracking-widest
          hover:bg-neon-cyan/20 active:translate-y-0.5 transition-all
          ${hacking ? 'shadow-[0_0_15px_rgba(4,217,255,0.8)] border-neon-cyan' : ''}
        `}
            >
                <span className="relative z-10">INIT_HACK()</span>
                {/* Simple glitch overlay */}
                {hacking && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse z-0" />
                )}
            </button>

            {added > 0 && (
                <span className="absolute -top-6 right-0 text-neon-cyan text-xs animate-bounce font-bold">
                    +{added}
                </span>
            )}
        </div>
    );
}
