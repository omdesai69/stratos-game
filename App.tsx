import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GameState, LevelConfig } from './types';
import { DEFAULT_LEVEL_CONFIG } from './constants';
import { generateLevelDetails, getProceduralLevel } from './services/geminiService';
import { audioService } from './services/audioService';

export default function App() {
  console.log("✅ App Component Rendering");
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [focus, setFocus] = useState(100);
  const [energy, setEnergy] = useState(0);
  const [combo, setCombo] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [maxReachedLevel, setMaxReachedLevel] = useState(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(DEFAULT_LEVEL_CONFIG);

  useEffect(() => {
    const savedScore = localStorage.getItem('stratos_highscore');
    const savedMaxLevel = localStorage.getItem('stratos_maxlevel');
    if (savedScore) setHighScore(parseInt(savedScore, 10));
    if (savedMaxLevel) setMaxReachedLevel(parseInt(savedMaxLevel, 10));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('stratos_highscore', score.toString());
    }
    if (currentLevel > maxReachedLevel) {
      setMaxReachedLevel(currentLevel);
      localStorage.setItem('stratos_maxlevel', currentLevel.toString());
    }
  }, [score, highScore, currentLevel, maxReachedLevel]);

  const handleStartGame = useCallback(async (levelToStart?: number) => {
    // Initialize audio on first user interaction
    audioService.init();
    audioService.playClick();

    setScore(0);
    setHealth(100); // Reset health logic in App
    setFocus(100);
    setEnergy(0);
    setCombo(0);
    setProgress(0);

    const startLevel = levelToStart || 1;
    setCurrentLevel(startLevel);

    // Visual Transition State
    setGameState(GameState.LEVEL_TRANSITION);

    try {
      // Increased timeout to 5s to give AI more time, but silence errors
      const configPromise = generateLevelDetails(startLevel);
      const timeoutPromise = new Promise<LevelConfig>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000));
      const config = await Promise.race([configPromise, timeoutPromise]);
      setLevelConfig(config);
    } catch (e) {
      // Silent fallback
      setLevelConfig(getProceduralLevel(startLevel));
    }

    setGameState(GameState.PLAYING);
  }, []);

  const handleLevelWarpComplete = useCallback(() => {
    setGameState(GameState.LEVEL_TRANSITION);
    setTimeout(() => {
      // Victory after completing level 100
      if (levelConfig.levelNumber >= 100) {
        setGameState(GameState.VICTORY);
        audioService.playLevelComplete();
        if (levelConfig.levelNumber > maxReachedLevel) {
          setMaxReachedLevel(levelConfig.levelNumber);
          localStorage.setItem('maxLevel', levelConfig.levelNumber.toString());
        }
      } else {
        setGameState(GameState.LEVEL_COMPLETE);
        audioService.playLevelComplete();
      }
    }, 2000);
  }, [levelConfig, maxReachedLevel]);

  const handleNextLevel = useCallback(async () => {
    setGameState(GameState.LEVEL_TRANSITION);

    const nextLevel = currentLevel + 1;
    setCurrentLevel(nextLevel);

    setHealth(h => Math.min(100, h + 50));
    setFocus(100);
    setProgress(0);

    try {
      const configPromise = generateLevelDetails(nextLevel);
      const timeoutPromise = new Promise<LevelConfig>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000));
      const config = await Promise.race([configPromise, timeoutPromise]);
      setLevelConfig(config);
    } catch (e) {
      setLevelConfig(getProceduralLevel(nextLevel));
    }

    setGameState(GameState.PLAYING);
  }, [currentLevel]);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameState(GameState.GAME_OVER);
    audioService.playGameOver();
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
  }, [gameState]);

  const handleExit = useCallback(() => {
    setGameState(GameState.MENU);
  }, []);

  const handleViewMap = useCallback(() => {
    setGameState(GameState.MAP);
  }, []);

  const [calibrationTrigger, setCalibrationTrigger] = useState(0);

  const handleCalibrate = useCallback(() => {
    setCalibrationTrigger(Date.now());
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans select-none text-white" style={{ position: 'relative', width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden' }}>
      <div className="absolute inset-0 z-10" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
        {/* CRITICAL FIX: The key prop forces React to destroy and recreate the GameCanvas 
              whenever the level instance changes. This completely wipes stale state/memory 
              and prevents the "Death Loop" bug. */}
        <GameCanvas
          key={levelConfig.instanceId}
          gameState={gameState}
          levelConfig={levelConfig}
          health={health}
          setScore={setScore}
          setHealth={setHealth}
          setFocus={setFocus}
          setEnergy={setEnergy}
          setCombo={setCombo}
          setProgress={setProgress}
          onGameOver={handleGameOver}
          onLevelComplete={handleLevelWarpComplete}
          calibrationTrigger={calibrationTrigger}
        />
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none' }}>
        <UIOverlay
          gameState={gameState}
          score={score}
          health={health}
          focus={focus}
          energy={energy}
          combo={combo}
          progress={progress}
          levelConfig={levelConfig}
          highScore={highScore}
          maxReachedLevel={maxReachedLevel}
          onStart={handleStartGame}
          onPause={handlePause}
          onResume={handleResume}
          onExit={handleExit}
          onNextLevel={handleNextLevel}
          onHome={handleExit}
          onViewMap={handleViewMap}
          onCalibrate={handleCalibrate}
        />
      </div>
    </div>
  );
}