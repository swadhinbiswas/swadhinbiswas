import React, { useState, useEffect, useRef } from "react";

const COMMANDS = {
    help: "Available commands: help, ls, whoami, clear, home, game",
    ls: "home/  projects/  about/  contact/  blog/",
    whoami: "guest@universe",
    clear: "CLEAR_SCREEN",
    home: "Redirecting to / ...",
    game: "Starting Snake protocol..."
};

export default function Terminal404() {
    const [history, setHistory] = useState<string[]>(["Error 404: Location not found.", "Type 'help' for available commands."]);
    const [input, setInput] = useState("");
    const [isGameActive, setIsGameActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
    }, [history]);

    const handleCommand = (cmd: string) => {
        const trimmed = cmd.trim().toLowerCase();
        let output = "";

        if (trimmed === "clear") {
            setHistory([]);
            return;
        }

        if (trimmed === "home") {
            output = COMMANDS.home;
            setTimeout(() => window.location.href = "/", 1000);
        } else if (trimmed === "game") {
            output = COMMANDS.game;
            setTimeout(() => setIsGameActive(true), 1000);
        } else if (trimmed in COMMANDS) {
            output = COMMANDS[trimmed as keyof typeof COMMANDS];
        } else if (trimmed === "") {
            output = "";
        } else {
            output = `Command not found: ${trimmed}. Type 'help' for assistance.`;
        }

        setHistory(prev => [...prev, `> ${cmd}`, output]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleCommand(input);
            setInput("");
        }
    };

    if (isGameActive) {
        return <SnakeGame onExit={() => setIsGameActive(false)} />;
    }

    return (
        <div
            className="w-full h-full min-h-[500px] bg-black text-green-500 font-mono p-4 md:p-8 rounded-xl border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)] overflow-hidden flex flex-col"
            onClick={() => inputRef.current?.focus()}
        >
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-green-900">
                {history.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap animate-in fade-in duration-300">{line}</div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 mt-4 border-t border-green-500/30 pt-4">
                <span>guest@swadhin:~$</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0 placeholder-green-800"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
                <span className="animate-pulse">▋</span>
            </div>
        </div>
    );
}

// Simple Snake Game Sub-Component
function SnakeGame({ onExit }: { onExit: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let snake = [{ x: 10, y: 10 }];
        let food = { x: 15, y: 15 };
        let dx = 0;
        let dy = 0;
        let speed = 7;
        let tileCount = 20; // 20x20 grid
        let tileSize = canvas.width / tileCount;

        const gameLoop = setInterval(drawGame, 1000 / speed);

        function drawGame() {
            if (!ctx || !canvas) return;
            // Logic
            let head = { x: snake[0].x + dx, y: snake[0].y + dy };

            // Wall collision - game over
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                setGameOver(true);
                clearInterval(gameLoop);
                return;
            }

            // Self collision
            for (let i = 0; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y && (dx !== 0 || dy !== 0)) {
                    setGameOver(true);
                    clearInterval(gameLoop);
                    return;
                }
            }

            snake.unshift(head);

            // Eat food
            if (head.x === food.x && head.y === food.y) {
                setScore(s => s + 1);
                food = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
            } else {
                snake.pop(); // Remove tail
            }

            // Draw
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Snake
            ctx.fillStyle = "lime";
            for (let part of snake) {
                ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize - 2, tileSize - 2);
            }

            // Food
            ctx.fillStyle = "red";
            ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize - 2, tileSize - 2);
        }

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
            if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
            if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
            if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
            // Start on any key
        };

        window.addEventListener('keydown', handleKey);
        return () => {
            clearInterval(gameLoop);
            window.removeEventListener('keydown', handleKey);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-black border border-green-500 rounded-xl h-full font-mono">
            <h3 className="text-green-500 mb-2">SNAKE PROTOCOL</h3>
            <div className="relative">
                <canvas ref={canvasRef} width="300" height="300" className="bg-black border border-green-800" />
                {gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 flex-col text-green-500">
                        <p className="text-xl font-bold">GAME OVER</p>
                        <p>Score: {score}</p>
                        <button onClick={onExit} className="mt-4 px-4 py-2 border border-green-500 hover:bg-green-500/20">EXIT</button>
                    </div>
                )}
            </div>
            <p className="text-green-700 text-xs mt-2">Use Arrow Keys</p>
            {!gameOver && <button onClick={onExit} className="mt-4 text-xs text-red-500 hover:underline">Exit Game</button>}
        </div>
    );
}
