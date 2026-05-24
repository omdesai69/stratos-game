import React, { useEffect, useRef } from 'react';
import { GameState, LevelConfig } from '../types';
import { getProceduralLevel } from '../services/geminiService';
import { COLORS } from '../constants';

interface UIOverlayProps {
    gameState: GameState;
    score: number;
    health: number;
    progress: number;
    levelConfig: LevelConfig;
    highScore: number;
    maxReachedLevel?: number;
    focus?: number;
    energy?: number;
    combo?: number;
    onStart: (level?: number) => void;
    onPause: () => void;
    onResume: () => void;
    onExit: () => void;
    onNextLevel: () => void;
    onHome: () => void;
    onViewMap: () => void;
    onCalibrate?: () => void;
}

const GlassButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; variant?: 'primary' | 'secondary' | 'danger' }> = ({ onClick, children, className = '', variant = 'primary' }) => {
    const baseStyles = "px-8 py-3 rounded-full font-medium tracking-wide transition-all duration-300 backdrop-blur-xl shadow-lg text-sm cursor-pointer pointer-events-auto select-none flex items-center justify-center active:scale-95";
    const variants = {
        primary: "bg-white text-black hover:bg-gray-200 hover:scale-105 hover:shadow-white/20 border border-white/50",
        secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40",
        danger: "bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20"
    };
    return (
        <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className} `}>
            {children}
        </button>
    );
};

export const UIOverlay = React.memo<UIOverlayProps>(({
    gameState,
    score,
    health,
    progress,
    levelConfig,
    highScore,
    maxReachedLevel = 1,
    focus = 100,
    energy = 0,
    combo = 0,
    onStart,
    onPause,
    onResume,
    onExit,
    onNextLevel,
    onHome,
    onViewMap,
    onCalibrate
}) => {

    const activeLevelRef = useRef<HTMLLIElement>(null);
    useEffect(() => {
        if (gameState === GameState.MAP && activeLevelRef.current) {
            activeLevelRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
    }, [gameState]);

    if (gameState === GameState.LEVEL_TRANSITION) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/20 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 animate-progress-indeterminate"></div>
                    </div>
                    <span className="text-cyan-400 text-[10px] tracking-[0.4em] uppercase animate-pulse">Initiating Hyperjump</span>
                </div>
            </div>
        )
    }

    if (gameState === GameState.VICTORY) {
        return (
            <div className="absolute inset-0 pointer-events-auto flex items-center justify-center z-50 bg-gradient-to-b from-black via-purple-900/20 to-black transition-all duration-1000 ease-in-out overflow-hidden">
                {/* Animated Stars Background */}
                <div className="absolute inset-0 opacity-30">
                    {Array.from({ length: 100 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                opacity: Math.random()
                            }}
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center gap-8 p-12 text-center max-w-2xl transition-all duration-700 ease-out transform scale-100 opacity-100 z-10">
                    <div className="text-[10px] md:text-xs font-bold tracking-[0.5em] text-cyan-400/80 uppercase mb-4 animate-pulse">
                        Journey Complete
                    </div>

                    <h1 className="text-6xl md:text-8xl font-light text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-wider uppercase mb-4 transition-all duration-500">
                        Victory
                    </h1>

                    <p className="text-xl md:text-2xl text-white/70 mb-8 leading-relaxed max-w-lg transition-all duration-300">
                        You've traversed the cosmos, navigated through 100 sectors of deep space, and reached your destination.
                    </p>

                    <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-2xl p-8 mb-8 transition-all duration-300">
                        <div className="text-5xl md:text-6xl font-mono text-cyan-400 mb-2">{score.toLocaleString()}</div>
                        <div className="text-sm uppercase tracking-widest text-white/50">Final Score</div>
                    </div>

                    <p className="text-lg text-white/60 italic mb-8">
                        "Not all who wander are lost. Some are just finding their way home."
                    </p>

                    <div className="flex flex-col gap-4 w-80">
                        <GlassButton onClick={onHome} variant="primary" className="py-4">
                            Return to Main Menu
                        </GlassButton>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === GameState.GAME_OVER) {
        return (
            <div className="absolute inset-0 pointer-events-auto flex items-center justify-center z-50 bg-black/80 backdrop-blur-md transition-all duration-700 ease-in-out">
                <div className="flex flex-col items-center gap-6 p-10 border border-white/10 rounded-3xl bg-[#0a0a0a] shadow-2xl transition-all duration-500 ease-out transform scale-100 opacity-100">
                    <h2 className="text-5xl font-light text-red-500 tracking-widest uppercase transition-all duration-300">Terminated</h2>
                    <div className="text-white/50 text-sm tracking-[0.2em] uppercase">Mission Failure</div>
                    <div className="text-4xl font-mono text-white my-4 transition-all duration-300">{score.toLocaleString()}</div>
                    <div className="flex flex-col gap-4 w-64">
                        <GlassButton onClick={() => onStart(levelConfig.levelNumber)} variant="primary">Re-Initialize</GlassButton>
                        <GlassButton onClick={onHome} variant="secondary">Abort to Menu</GlassButton>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === GameState.PLAYING) {
        return (
            <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between font-sans overflow-hidden">
                <div className="flex items-start gap-6 pointer-events-auto z-10">
                    <div className="flex flex-col">
                        <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Score</div>
                        <div className="text-2xl md:text-3xl font-light text-white tabular-nums tracking-tight">{score.toLocaleString()}</div>

                        <div className={`mt-2 transition-all duration-200 ${combo > 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            <span className="text-yellow-400 font-bold text-xl italic pr-2">{combo}x</span>
                            <span className="text-yellow-400/60 text-[10px] uppercase tracking-widest">Combo</span>
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 top-6 -translate-x-1/2 w-48 md:w-80 flex flex-col items-center gap-2">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white shadow-[0_0_15px_white]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.3em] text-white/40">Distance to Warp</div>
                </div>

                <div className="absolute top-6 right-8 pointer-events-auto z-50">
                    <button onClick={onPause} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5V19M16 5V19" stroke="white" strokeWidth="4" strokeLinecap="round" /></svg>
                    </button>
                </div>

                {/* Sonic Boom Button (Mobile/Desktop) */}
                {energy >= 100 && (
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 text-center z-50 pointer-events-auto cursor-pointer" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}>
                        <div className="animate-pulse">
                            <div className="text-cyan-400 text-xs tracking-[0.3em] uppercase font-bold mb-1">System Charged</div>
                            <div className="text-white text-sm tracking-widest border border-cyan-500/50 px-6 py-2 rounded bg-cyan-500/20 hover:bg-cyan-500/40 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                <span className="hidden md:inline">PRESS SPACE</span>
                                <span className="md:hidden">DOUBLE TAP TO BOOM</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end w-full z-10 pb-6 md:pb-0">
                    {/* Health Bar */}
                    <div className="w-[30%] md:w-48">
                        <div className="flex justify-between text-[10px] md:text-xs mb-1 md:mb-2">
                            <span className="text-white/50 uppercase tracking-wider hidden md:inline">Integrity</span>
                            <span className="text-white/50 uppercase tracking-wider md:hidden">HP</span>
                            <span className={`${health < 30 ? 'text-red-500' : 'text-white'} `}>{health.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 md:h-2 bg-white/10 rounded overflow-hidden skew-x-[-12deg]">
                            <div className={`h-full transition-all duration-300 ${health > 50 ? 'bg-white' : 'bg-red-500'}`} style={{ width: `${health}%` }} />
                        </div>
                    </div>

                    {/* Energy Bar (Right on Mobile, Center on Desktop) */}
                    <div className="flex flex-col items-end md:items-center w-[30%] md:w-64 pb-1 md:pb-4">
                        <div className="w-full flex flex-row-reverse md:flex-row justify-between text-[8px] md:text-[9px] uppercase tracking-widest text-cyan-300/60 mb-1">
                            <span className="hidden md:inline">Hyper-Flux</span>
                            <span className="md:hidden">FLUX</span>
                            <span>{energy.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 md:h-3 bg-black/40 border border-cyan-500/30 rounded-full p-0.5">
                            <div
                                className={`h-full rounded-full transition-all duration-200 ${energy >= 100 ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'bg-cyan-900'}`}
                                style={{ width: `${energy}%` }}
                            />
                        </div>
                    </div>

                    {/* Focus Bar - HIDDEN ON MOBILE */}
                    <div className="hidden md:block w-[30%] md:w-48 text-right">
                        <div className="flex justify-between text-[10px] md:text-xs mb-1 md:mb-2 flex-row-reverse">
                            <span className="text-white/50 uppercase tracking-wider hidden md:inline">Focus</span>
                            <span className="text-white/50 uppercase tracking-wider md:hidden">FCS</span>
                            <span className="text-indigo-300">{focus.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 md:h-2 bg-white/10 rounded overflow-hidden skew-x-[12deg]">
                            <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300" style={{ width: `${focus}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === GameState.PAUSED) {
        return (
            <div className="absolute inset-0 pointer-events-auto flex items-center justify-center bg-black/60 backdrop-blur-xl z-50 transition-all duration-500 ease-in-out">
                <div className="flex flex-col items-center gap-8 p-12 rounded-3xl border border-white/5 bg-black/40 shadow-2xl transition-all duration-300 ease-out transform scale-100">
                    <div className="text-white/40 text-xs tracking-[0.4em] uppercase">Simulation Paused</div>
                    <div className="flex flex-col gap-4 w-64">
                        <GlassButton onClick={onResume} variant="primary">Resume</GlassButton>
                        <GlassButton onClick={onExit} variant="danger">Abort</GlassButton>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === GameState.MAP) {
        const totalLevels = 100;
        const listItems = [];
        for (let i = 1; i <= totalLevels; i++) {
            const isLocked = i > maxReachedLevel;
            const isCurrent = i === levelConfig.levelNumber;
            const levelData = getProceduralLevel(i);
            listItems.push(
                <li
                    key={i}
                    ref={isCurrent ? activeLevelRef : null}
                    onClick={() => !isLocked && onStart(i)}
                    className={`
                        w-full p-5 border-b border-white/5 flex items-center justify-between transition-all duration-300 ease-out
                        ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer hover:bg-cyan-500/10 hover:border-l-2 hover:border-l-cyan-400/50 hover:shadow-[inset_0_0_30px_rgba(34,211,238,0.15)]'}
                        ${isCurrent ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-l-4 border-l-cyan-400 shadow-[inset_0_0_40px_rgba(34,211,238,0.2)]' : ''}
                    `}
                >
                    <div className="flex items-center gap-5">
                        <div className={`text-xs font-mono tracking-widest transition-all duration-300 ${isCurrent ? 'text-cyan-400 font-bold scale-110' : 'text-white/50'}`}>
                            {i.toString().padStart(3, '0')}
                        </div>
                        <div className={`text-base font-light tracking-wide transition-all duration-300 ${isCurrent ? 'text-white font-medium scale-105' : 'text-white/70'}`}>
                            {levelData.missionName}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {i < maxReachedLevel && <span className="text-[10px] text-green-400 tracking-wider uppercase font-semibold bg-green-400/10 px-2 py-1 rounded">Cleared</span>}
                        {isLocked && <span className="text-[10px] text-red-400/70 tracking-wider uppercase">Locked</span>}
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isCurrent ? 'bg-cyan-400 shadow-[0_0_15px_#00f3ff] scale-150' : (isLocked ? 'bg-white/10' : 'bg-green-500 shadow-[0_0_8px_#22c55e]')}`} />
                    </div>
                </li>
            );
        }

        return (
            <div className="absolute inset-0 pointer-events-auto flex flex-col items-center bg-[#050505] z-50">
                <div className="w-full p-6 flex justify-between items-center border-b border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#050505] shadow-xl z-20 backdrop-blur-sm">
                    <span className="text-white font-light text-lg tracking-[0.2em] uppercase">Tactical Navigation</span>
                    <button onClick={onHome} className="text-white/50 hover:text-cyan-400 transition-all duration-300 text-xs tracking-widest uppercase border border-white/20 hover:border-cyan-400/50 px-4 py-2 rounded hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">Close</button>
                </div>
                <ul className="w-full max-w-2xl overflow-y-auto flex-1 pb-20 scrollbar-hide">
                    {listItems}
                </ul>
            </div>
        )
    }

    if (gameState === GameState.LEVEL_COMPLETE) {
        return (
            <div className="absolute inset-0 pointer-events-auto flex items-center justify-center z-50 p-4 transition-all duration-700 ease-in-out">
                <div className="bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-[2rem] text-center w-full max-w-md shadow-2xl relative overflow-hidden transition-all duration-500 ease-out transform scale-100">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>

                    <div className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-green-400/80 mb-2 md:mb-4 uppercase transition-all duration-300">Mission Accomplished</div>

                    <h2 className="text-3xl md:text-4xl font-light text-white mb-2 transition-all duration-300">Sector {levelConfig.levelNumber}</h2>
                    <p className="text-white/40 text-sm mb-8 tracking-wide uppercase transition-all duration-300">{levelConfig.missionName}</p>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10 bg-black/20 rounded-2xl p-4 md:p-6 border border-white/5">
                        <div className="flex flex-col gap-1 transition-all duration-300">
                            <div className="text-2xl md:text-3xl font-mono text-white tracking-tighter">{score.toLocaleString()}</div>
                            <div className="text-[9px] uppercase text-white/30 tracking-widest">Total Score</div>
                        </div>
                        <div className="flex flex-col gap-1 transition-all duration-300">
                            <div className="text-2xl md:text-3xl font-mono text-green-400 tracking-tighter">{health.toFixed(0)}%</div>
                            <div className="text-[9px] uppercase text-white/30 tracking-widest">Hull Integrity</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <GlassButton onClick={onNextLevel} variant="primary" className="w-full py-4 text-base shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            Warp to Next Sector
                        </GlassButton>
                        <GlassButton onClick={onHome} variant="secondary" className="w-full">
                            Return to Base
                        </GlassButton>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === GameState.MENU) {
        return (
            <div className="absolute inset-0 pointer-events-auto flex flex-col z-50" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50 }}>
                <div className="min-h-screen flex flex-col items-center justify-center w-full">
                    <div className="flex flex-col items-center text-center">
                        <h1 className="text-7xl md:text-9xl font-light tracking-[0.1em] text-white mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">STRATOS</h1>
                        <div className="flex items-center justify-center gap-6 mt-2 mb-16">
                            <div className="h-[1px] w-12 bg-white/20"></div>
                            <p className="text-white/40 text-xs tracking-[0.5em] uppercase font-medium">Hyper-Kinetic Avoider</p>
                            <div className="h-[1px] w-12 bg-white/20"></div>
                        </div>  
                    </div>
                    <div className="flex flex-col gap-5 w-72">
                        <GlassButton onClick={() => onStart(maxReachedLevel)} variant="primary">INITIATE</GlassButton>
                        <GlassButton onClick={onViewMap} variant="secondary">CAMPAIGN</GlassButton>
                    </div>

                    <div className="hidden md:flex absolute bottom-10 w-full justify-center gap-16 text-white/20 text-[10px] uppercase tracking-widest">
                        <div><span className="border border-white/20 px-2 py-1 rounded mx-1">WASD</span> Move</div>
                        <div><span className="border border-white/20 px-2 py-1 rounded mx-1">SHIFT</span> Focus</div>
                        <div><span className="border border-white/20 px-2 py-1 rounded mx-1">SPACE</span> Sonic Boom</div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
});

UIOverlay.displayName = 'UIOverlay';