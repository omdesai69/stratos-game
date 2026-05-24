/* eslint-disable security/detect-object-injection */
import React, { useRef, useEffect, useCallback } from 'react';
import { Entity, Particle, GameState, LevelConfig, PowerUp, FloatingText, Shockwave, NebulaCloud } from '../types';
import { PLAYER_SPEED, COLORS } from '../constants';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
    gameState: GameState;
    levelConfig: LevelConfig;
    health: number;
    setScore: (score: number) => void;
    setHealth: (hp: number) => void;
    setFocus: (val: number) => void;
    setEnergy: (val: number) => void;
    setCombo: (val: number) => void;
    setProgress: (percent: number) => void;
    onGameOver: (finalScore: number) => void;
    onLevelComplete: () => void;
    calibrationTrigger: number;
}

interface Star {
    x: number;
    y: number;
    z: number;
    size: number;
    brightness: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
    gameState,
    levelConfig,
    health,
    setScore,
    setHealth,
    setFocus,
    setEnergy,
    setCombo,
    setProgress,
    onGameOver,
    onLevelComplete,
    calibrationTrigger
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    // Refs for closures
    const gameStateRef = useRef(gameState);
    const levelConfigRef = useRef(levelConfig);
    const onGameOverRef = useRef(onGameOver);
    const onLevelCompleteRef = useRef(onLevelComplete);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { levelConfigRef.current = levelConfig; }, [levelConfig]);
    useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);
    useEffect(() => { onLevelCompleteRef.current = onLevelComplete; }, [onLevelComplete]);

    // Throttling Refs
    const lastReportedScore = useRef(0);
    const lastReportedHealth = useRef(100);
    const lastReportedFocus = useRef(100);
    const lastReportedEnergy = useRef(0);
    const lastReportedProgress = useRef(0);

    // Initialize Player with passed-in health (Guaranteed fresh by key prop)
    const isMobile = window.innerWidth < 768;
    const playerRef = useRef<Entity>({
        id: 'player',
        x: window.innerWidth / 2,
        y: window.innerHeight - 200,
        vx: 0, vy: 0,
        width: isMobile ? 25 : 40, // Adjusted from 6 to 25 for fair collision
        height: isMobile ? 37 : 60, // Maintains aspect ratio
        type: 'player',
        hp: health,
        color: '#fff',
        rotation: 0
    });

    // Sync Health during gameplay (e.g. if App heals player)
    useEffect(() => {
        if (playerRef.current.hp !== health) {
            playerRef.current.hp = health;
        }
        // Unlock death flag if healed
        if (health > 0) {
            isDeadRef.current = false;
        }
    }, [health]);

    const enemiesRef = useRef<Entity[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    const shockwavesRef = useRef<Shockwave[]>([]);

    const nebulasRef = useRef<NebulaCloud[]>([]);
    const starsRef = useRef<Star[]>([]);
    const backgroundInitialized = useRef(false);

    const scoreRef = useRef(0);
    const frameRef = useRef(0);
    const levelDistanceRef = useRef(0);
    const GOAL_DISTANCE = 50000; // Increased from 4000 to 50000 for proper level length

    const isWarpingRef = useRef(false);
    const warpTimerRef = useRef(0);
    const gracePeriodRef = useRef(180); // 3 Seconds invulnerability on start
    const hasTriggeredCompleteRef = useRef(false);
    const isDeadRef = useRef(false);

    const focusMeterRef = useRef(100);
    const energyMeterRef = useRef(0);
    const ghostTimerRef = useRef(0);
    const shieldTimerRef = useRef(0);
    const comboCounterRef = useRef(0);

    const shakeRef = useRef(0);
    const backgroundOffsetRef = useRef(0);
    const shieldWarningPlayedRef = useRef(false); // Track if warning sound played

    const keysRef = useRef<{ [key: string]: boolean }>({});
    const lastTimeRef = useRef(0);

    // Mobile Control Refs
    const touchAnchorRef = useRef<{ x: number, y: number } | null>(null);
    const currentTouchRef = useRef<{ x: number, y: number } | null>(null);
    const tiltRef = useRef<{ beta: number, gamma: number }>({ beta: 0, gamma: 0 });
    const neutralTiltRef = useRef<{ beta: number, gamma: number }>({ beta: 10, gamma: 0 }); // Default 10 deg (Flatter)

    // Calibration Handler
    useEffect(() => {
        if (calibrationTrigger > 0) {
            neutralTiltRef.current = { ...tiltRef.current };
            // Provide visual feedback (shake)
            shakeRef.current = 10;
        }
    }, [calibrationTrigger]);

    const lastTapTimeRef = useRef(0);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Double Tap Logic for Sonic Boom
            if (energyMeterRef.current >= 100 && gameStateRef.current === GameState.PLAYING) {
                const now = Date.now();
                if (now - lastTapTimeRef.current < 300) {
                    e.preventDefault();
                    triggerSonicBoom();
                    lastTapTimeRef.current = 0; // Reset to prevent triple-tap triggering twice
                    return;
                }
                lastTapTimeRef.current = now;
            }

            // Otherwise, handle normal movement
            if (e.touches.length === 1) {
                const t = e.touches[0];
                touchAnchorRef.current = { x: t.clientX, y: t.clientY };
                currentTouchRef.current = { x: t.clientX, y: t.clientY };
            }
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (touchAnchorRef.current) {
                e.preventDefault(); // Prevent scrolling while playing
                const t = e.touches[0];
                currentTouchRef.current = { x: t.clientX, y: t.clientY };
            }
        };
        const handleTouchEnd = (e: TouchEvent) => {
            touchAnchorRef.current = null;
            currentTouchRef.current = null;
        };

        const handleOrientation = (e: DeviceOrientationEvent) => {
            tiltRef.current = { beta: e.beta || 0, gamma: e.gamma || 0 };
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        }
        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            if (canvas) {
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchmove', handleTouchMove);
                canvas.removeEventListener('touchend', handleTouchEnd);
            }
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    const addScreenShake = (amount: number) => {
        shakeRef.current = Math.min(shakeRef.current + amount, 20);
    };

    const spawnFloatingText = (x: number, y: number, text: string, color: string = '#fff', size: number = 14) => {
        floatingTextsRef.current.push({
            id: Math.random().toString(),
            x, y, text, color, size,
            life: 1.0,
            vy: -1
        });
    };

    const spawnShockwave = (x: number, y: number) => {
        shockwavesRef.current.push({
            id: Math.random().toString(),
            x, y,
            radius: 10,
            maxRadius: 500,
            life: 1.0
        });
        addScreenShake(20);
    };



    const spawnPowerUp = (x: number, y: number) => {
        const rand = Math.random();
        let type: PowerUp['type'] = 'HEALTH';
        let color = '#B5EAD7';
        // Removed GHOST power-up as requested
        if (rand > 0.7) { type = 'SHIELD'; color = '#C7CEEA'; }
        else if (rand > 0.5) { type = 'ENERGY'; color = COLORS.accent; }
        else { type = 'HEALTH'; color = '#B5EAD7'; }

        powerUpsRef.current.push({
            id: Math.random().toString(),
            x, y, vx: 0, vy: 1.5,
            type, color
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // eslint-disable-next-line security/detect-object-injection
            keysRef.current[e.code] = true;
            if (e.code === 'Space' && energyMeterRef.current >= 100 && gameStateRef.current === GameState.PLAYING) {
                triggerSonicBoom();
            }
        };
        // eslint-disable-next-line security/detect-object-injection
        const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const triggerSonicBoom = () => {
        const player = playerRef.current;
        energyMeterRef.current = 0;
        setEnergy(0);
        spawnShockwave(player.x, player.y);
        enemiesRef.current.forEach(e => { e.vy = -20; });
        // Ghost timer removed
        addScreenShake(25);
        spawnParticle(player.x, player.y, '#fff', 'glow');
        audioService.playSonicBoom();
    };

    // --- OPTIMIZATION: Off-screen Canvas for Asteroids ---
    const asteroidCacheRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!asteroidCacheRef.current) {
            const cache = document.createElement('canvas');
            const size = 100;
            cache.width = size;
            cache.height = size;
            const ctx = cache.getContext('2d');
            if (ctx) {
                const center = size / 2;
                const radius = 46;

                // 1. Base Shape (Irregular)
                ctx.beginPath();
                const points = 12;
                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    const variance = Math.sin(i * 3) * 2 + Math.cos(i * 5) * 2;
                    const r = radius + variance;
                    const x = center + Math.cos(angle) * r;
                    const y = center + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();

                // 2. Base Gradient (Metallic/Mineral Look)
                const grad = ctx.createRadialGradient(center - 15, center - 15, 2, center, center, radius);
                grad.addColorStop(0, '#d4d4d4');   // Specular Highlight (Shiny)
                grad.addColorStop(0.1, '#8c8c8c'); // Light Grey
                grad.addColorStop(0.4, '#4a4a4a'); // Midtone
                grad.addColorStop(0.8, '#222222'); // Shadow
                grad.addColorStop(1, '#0a0a0a');   // Deep Shadow
                ctx.fillStyle = grad;
                ctx.fill();

                // 3. Clip to shape
                ctx.save();
                ctx.clip();

                // 4. Texture (High Contrast Noise)
                ctx.fillStyle = 'rgba(0,0,0,0.25)'; // Darker noise
                for (let i = 0; i < 60; i++) {
                    const x = (Math.sin(i) * 0.5 + 0.5) * size;
                    const y = (Math.cos(i * 1.3) * 0.5 + 0.5) * size;
                    const s = (Math.sin(i * 2) + 2.5);
                    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
                }
                // Add some light flecks (mineral sparkles)
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                for (let i = 0; i < 20; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
                }

                // 5. Craters (Deep & Scary)
                const drawCrater = (cx: number, cy: number, r: number) => {
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.6)'; // Very dark base
                    ctx.fill();

                    // Inner Shadow (Sharp contrast)
                    ctx.beginPath(); ctx.arc(cx + r * 0.2, cy + r * 0.2, r * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fill();

                    // Rim Highlight (Sharp edge)
                    ctx.beginPath(); ctx.arc(cx + r * 0.1, cy + r * 0.1, r, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                };

                drawCrater(center - 12, center - 12, 14);
                drawCrater(center + 18, center + 22, 9);
                drawCrater(center - 22, center + 18, 6);
                drawCrater(center + 25, center - 18, 7);

                ctx.restore(); // End Clip

                // 6. Sci-Fi Rim Light (Cyan/Blue Tint)
                ctx.beginPath();
                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    const variance = Math.sin(i * 3) * 2 + Math.cos(i * 5) * 2;
                    const r = radius + variance;
                    const x = center + Math.cos(angle) * r;
                    const y = center + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                // Subtle Cyan Rim to match game theme
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            asteroidCacheRef.current = cache;
        }
    }, []);

    // --- DRAWING FUNCTIONS (PRESERVED) ---
    const drawObstacle = (ctx: CanvasRenderingContext2D, e: Entity) => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);

        if (e.type === 'obstacle_asteroid') {
            if (asteroidCacheRef.current) {
                // OPTIMIZED: Draw pre-rendered sprite
                // REMOVED: shadowBlur/shadowColor (The "Red Border")
                ctx.drawImage(asteroidCacheRef.current, -e.width / 2, -e.width / 2, e.width, e.width);
            } else {
                // Fallback (should rarely happen)
                ctx.fillStyle = '#6e6e6e';
                ctx.beginPath(); ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2); ctx.fill();
            }
        } else if (e.type === 'homing_mine') {
            const pulse = 1 + Math.sin(frameRef.current * 0.1) * 0.2;
            ctx.fillStyle = '#ff2255';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff2255';
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 2 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (e.type === 'laser_beam') {
            // Laser beam fills height
            ctx.fillStyle = '#ff0055';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0055';
            ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-e.width / 4, -e.height / 2, e.width / 2, e.height);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    };

    const drawPlayerJet = (ctx: CanvasRenderingContext2D, p: Entity, isCinematic: boolean) => {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Mobile Visual Scaling (0.6x)
        if (window.innerWidth < 768) {
            ctx.scale(0.6, 0.6);
        }

        const bankAngle = isCinematic ? Math.sin(frameRef.current * 0.02) * 0.1 : (p.vx / 15) * 0.6;
        ctx.rotate(bankAngle);
        const thrust = isCinematic ? 1.2 : (1.0 + Math.max(0, -p.vy * 0.1) + (keysRef.current['Space'] ? 1.5 : 0));

        // Afterburners
        ctx.globalCompositeOperation = 'screen';
        [-14, 14].forEach(ox => {
            ctx.save(); ctx.translate(ox, 45);
            const flameLen = (60 * thrust) + (Math.random() * 10);
            const coreGrad = ctx.createLinearGradient(0, 0, 0, flameLen);
            coreGrad.addColorStop(0, '#bfefff'); coreGrad.addColorStop(1, 'rgba(0, 0, 255, 0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, flameLen); ctx.lineTo(4, 0); ctx.fill();
            ctx.restore();
        });
        ctx.globalCompositeOperation = 'source-over';

        // Body
        const bodyGrad = ctx.createLinearGradient(-15, 0, 15, 0);
        bodyGrad.addColorStop(0, '#64748b'); bodyGrad.addColorStop(0.5, '#e2e8f0'); bodyGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(15, 40); ctx.lineTo(0, 35); ctx.lineTo(-15, 40); ctx.closePath(); ctx.fill();
        // Wings
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(50, 50); ctx.lineTo(20, 50); ctx.lineTo(0, 20); ctx.lineTo(-20, 50); ctx.lineTo(-50, 50); ctx.fill();
        // Cockpit
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.ellipse(0, -30, 4, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.ellipse(0, -30, 1, 8, 0, 0, Math.PI * 2); ctx.fill();

        // Premium Ship-Shaped Shield (Follows Jet Contours)
        if (shieldTimerRef.current > 0) {
            const t = frameRef.current;
            const pulse = Math.sin(t * 0.05) * 0.1 + 0.9;

            // Shield offset (distance from ship surface)
            const offset = 12;

            // Blinking effect when shield is about to expire (last ~3 seconds = 180 frames)
            const isExpiring = shieldTimerRef.current < 180;
            const blinkVisible = isExpiring ? Math.floor(t / 8) % 2 === 0 : true;

            // Play warning beep once when entering expiring state
            if (isExpiring && !shieldWarningPlayedRef.current) {
                audioService.playShieldWarning();
                shieldWarningPlayedRef.current = true;
            }
            // Reset warning flag when shield is refreshed
            if (!isExpiring) {
                shieldWarningPlayedRef.current = false;
            }

            if (blinkVisible) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                // Create shield path that follows ship shape
                ctx.beginPath();

                // Nose (top)
                ctx.moveTo(0, -60 - offset);

                // Right side - front
                ctx.lineTo(15 + offset, 40);
                // Right wing tip
                ctx.lineTo(50 + offset, 50 + offset);
                ctx.lineTo(20, 50);
                // Right side - back
                ctx.lineTo(0, 35 + offset);

                // Left side - back
                ctx.lineTo(-20, 50);
                // Left wing tip
                ctx.lineTo(-50 - offset, 50 + offset);
                ctx.lineTo(-15 - offset, 40);

                // Left side - front (closing path)
                ctx.closePath();

                // Fill with pulsing gradient (redder when expiring)
                const shieldGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
                if (isExpiring) {
                    shieldGrad.addColorStop(0, `rgba(255, 100, 100, ${0.1 * pulse})`);
                    shieldGrad.addColorStop(0.5, `rgba(255, 150, 100, ${0.2 * pulse})`);
                    shieldGrad.addColorStop(1, `rgba(255, 200, 150, ${0.35 * pulse})`);
                } else {
                    shieldGrad.addColorStop(0, `rgba(0, 200, 255, ${0.05 * pulse})`);
                    shieldGrad.addColorStop(0.5, `rgba(0, 243, 255, ${0.15 * pulse})`);
                    shieldGrad.addColorStop(1, `rgba(100, 255, 255, ${0.3 * pulse})`);
                }
                ctx.fillStyle = shieldGrad;
                ctx.fill();

                // Draw glowing outline
                ctx.strokeStyle = isExpiring
                    ? `rgba(255, 150, 100, ${0.8 * pulse})`
                    : `rgba(0, 243, 255, ${0.8 * pulse})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = isExpiring ? '#ff6644' : '#00f3ff';
                ctx.shadowBlur = 15;
                ctx.stroke();

                ctx.restore();
            }
        }
        ctx.restore();
    };

    // --- OPTIMIZATION: Object Pooling & Fast Math ---
    // Pre-allocate particles to avoid GC
    // Mobile: 100 particles, Desktop: 200
    const MAX_PARTICLES = isMobile ? 100 : 200;
    const particlePoolRef = useRef<Particle[]>([]);
    const activeParticlesRef = useRef<number>(0);

    // Initialize pool once
    useEffect(() => {
        // Clear existing pool if resizing
        particlePoolRef.current = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            particlePoolRef.current.push({
                id: i.toString(), x: 0, y: 0, vx: 0, vy: 0,
                life: 0, maxLife: 1, color: '#fff', size: 1, decay: 0.01, type: 'spark'
            });
        }
    }, [isMobile]); // Re-init if device type changes

    const spawnParticle = (x: number, y: number, color: string, type: Particle['type'] = 'spark') => {
        // Mobile: Reduce spawn count for debris
        const count = type === 'debris' ? (isMobile ? 3 : 6) : (type === 'ring' ? 1 : 4);
        for (let i = 0; i < count; i++) {
            // Ring buffer allocation
            const idx = activeParticlesRef.current % MAX_PARTICLES;
            const p = particlePoolRef.current[idx];
            activeParticlesRef.current++;

            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (type === 'debris' ? 5 : 3);

            // Reset particle state
            p.x = x; p.y = y;
            p.vx = Math.cos(angle) * speed + (type === 'glow' ? (Math.random() - 0.5) : 0);
            p.vy = Math.sin(angle) * speed + (type === 'glow' ? 5 : 0);
            p.life = 1.0; p.maxLife = 1.0; p.color = color;
            p.size = type === 'glow' ? Math.random() * 8 + 4 : Math.random() * 2 + 1;
            p.decay = Math.random() * 0.03 + 0.015;
            p.type = type;
        }
    };

    // --- MAIN LOOP ---
    const loop = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        if (!canvas) { requestRef.current = requestAnimationFrame(loop); return; }
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) { requestRef.current = requestAnimationFrame(loop); return; }

        const dpr = window.devicePixelRatio || 1;
        const logicWidth = canvas.width / dpr;
        const logicHeight = canvas.height / dpr;

        let rawDt = Math.min((timestamp - lastTimeRef.current) / 16.67, 2); // Cap at 2 for smoothness
        if (lastTimeRef.current === 0) rawDt = 1;
        lastTimeRef.current = timestamp;

        const currentState = gameStateRef.current;
        const dt = currentState === GameState.PAUSED ? 0 : rawDt;

        // Background
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
        let scrollSpeed = 5;
        if (currentState === GameState.PLAYING) {
            scrollSpeed = (10 + levelConfigRef.current.speedMultiplier * 5) * dt;
            if (isWarpingRef.current) scrollSpeed *= 5;
        } else if (currentState === GameState.LEVEL_COMPLETE || currentState === GameState.LEVEL_TRANSITION) {
            scrollSpeed = 40 * dt;
        }
        backgroundOffsetRef.current += scrollSpeed;
        const bgGrad = ctx.createLinearGradient(0, 0, 0, logicHeight);
        bgGrad.addColorStop(0, '#020005'); bgGrad.addColorStop(1, '#080815');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, logicWidth, logicHeight);

        ctx.save();
        if (shakeRef.current > 0) {
            ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
            shakeRef.current *= 0.9;
        }

        // Nebulas - OPTIMIZATION: Skip on mobile or render simpler
        if (!isMobile) {
            nebulasRef.current.forEach(n => {
                const yPos = (n.y + backgroundOffsetRef.current * n.speed * 0.5) % (logicHeight + 1200) - 600;
                const grad = ctx.createRadialGradient(n.x, yPos, 0, n.x, yPos, n.size);
                grad.addColorStop(0, n.color); grad.addColorStop(1, 'transparent');
                ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = grad; ctx.globalAlpha = 0.15;
                ctx.beginPath(); ctx.arc(n.x, yPos, n.size, 0, Math.PI * 2); ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }

        // Stars
        starsRef.current.forEach(star => {
            star.y += scrollSpeed * star.z * 0.3; // Reduced from 0.5 for slower, calmer background
            if (currentState === GameState.PLAYING) {
                star.x -= (playerRef.current.vx * dt) * star.z * 0.05; // Parallax effect from player movement
            }
            if (star.y > logicHeight) { star.y = 0; star.x = Math.random() * logicWidth; }
            if (star.x < 0) { star.x += logicWidth; }
            if (star.x > logicWidth) { star.x -= logicWidth; }
            ctx.fillStyle = `rgba(255,255,255,${star.brightness * (0.1 + star.z * 0.3)})`;
            if (scrollSpeed > 20 && star.z > 1) {
                ctx.strokeStyle = `rgba(255,255,255,${star.brightness * 0.4})`; ctx.lineWidth = star.size;
                ctx.beginPath(); ctx.moveTo(star.x, star.y); ctx.lineTo(star.x, star.y - scrollSpeed); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Game Logic
        const player = playerRef.current;
        const isCinematic = currentState !== GameState.PLAYING;

        if (!isCinematic) {
            // Inputs
            // Inputs
            let dx = 0, dy = 0;

            // 1. Keyboard Input
            if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) dy -= 1;
            if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) dy += 1;
            if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) dx -= 1;
            if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) dx += 1;

            // 2. Touch Input (Invisible Joystick)
            if (touchAnchorRef.current && currentTouchRef.current) {
                const rawTDx = currentTouchRef.current.x - touchAnchorRef.current.x;
                const rawTDy = currentTouchRef.current.y - touchAnchorRef.current.y;

                // Dead zone to filter micro-jitter from finger movement
                const DEAD_ZONE = 12; // pixels
                const rawDist = Math.sqrt(rawTDx * rawTDx + rawTDy * rawTDy);

                let tDx = 0, tDy = 0;
                if (rawDist > DEAD_ZONE) {
                    // Map outer range smoothly (subtract dead zone, preserve direction)
                    const mapped = (rawDist - DEAD_ZONE) / rawDist;
                    tDx = rawTDx * mapped;
                    tDy = rawTDy * mapped;
                }

                // Sensitivity: Reduced from 0.12 to 0.06 for controlled feel
                const dragScale = 0.06;
                dx += tDx * dragScale;
                dy += tDy * dragScale;
            }

            // 3. Tilt Input - DISABLED (was causing drift issues)
            // Mobile now uses ONLY touch controls for reliability

            // Normalize/Clamp Input Vector
            // This allows for analog control (0.5 speed) but prevents exceeding max speed (1.0)
            // OPTIMIZATION: Squared Distance check
            const lenSq = dx * dx + dy * dy;
            if (lenSq > 1) {
                const len = Math.sqrt(lenSq);
                dx /= len;
                dy /= len;
            }

            const isFocusing = (keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight']) && focusMeterRef.current > 0;
            const timeScale = isFocusing ? 0.4 : 1.0;
            const effectiveDt = dt * timeScale;

            if (isFocusing) focusMeterRef.current = Math.max(0, focusMeterRef.current - 0.5 * dt);
            else focusMeterRef.current = Math.min(100, focusMeterRef.current + 0.1 * dt);
            if (energyMeterRef.current < 100) energyMeterRef.current = Math.min(100, energyMeterRef.current + 0.05 * dt);

            if (Math.abs(focusMeterRef.current - lastReportedFocus.current) > 1) {
                setFocus(Math.floor(focusMeterRef.current)); lastReportedFocus.current = focusMeterRef.current;
            }
            if (Math.abs(energyMeterRef.current - lastReportedEnergy.current) > 1) {
                setEnergy(Math.floor(energyMeterRef.current)); lastReportedEnergy.current = energyMeterRef.current;
            }

            // Player Movement with Velocity Smoothing (Lerp)
            const speed = PLAYER_SPEED * (isFocusing ? 0.5 : 1.0);
            const targetVx = dx * speed;
            const targetVy = dy * speed;

            // Smoothing factor: lower = smoother, higher = snappier (0.15 is balanced)
            const smoothing = 0.15;
            player.vx += (targetVx - player.vx) * smoothing;
            player.vy += (targetVy - player.vy) * smoothing;

            player.x += player.vx * effectiveDt;
            player.y += player.vy * effectiveDt;

            // Boundaries
            player.x = Math.max(20, Math.min(logicWidth - 20, player.x));
            player.y = Math.max(20, Math.min(logicHeight - 20, player.y));

            // Spawning
            const adjSpawnRate = Math.max(3, 20 / levelConfigRef.current.obstacleDensity);
            if (Math.random() < (1 / adjSpawnRate) * effectiveDt) {
                const randType = Math.random();
                let type: Entity['type'] = 'obstacle_asteroid';
                let size = 30 + Math.random() * 40;
                let height = size;
                let vx = (Math.random() - 0.5) * 2;
                let vy = (2 + Math.random() * 3);

                if (levelConfigRef.current.levelNumber > 10) {
                    if (randType > 0.95) {
                        type = 'laser_beam';
                        size = 15 + Math.random() * 20;
                        height = logicHeight * 1.5;
                        vx = 0;
                        vy = 10;
                    } else if (randType > 0.85) {
                        type = 'homing_mine';
                        size = 25;
                        height = 25;
                        vx = 0;
                        vy = 1.5;
                    }
                }

                enemiesRef.current.push({
                    id: Math.random().toString(),
                    x: Math.random() * logicWidth,
                    y: -height * 1.5,
                    vx, vy, width: size, height, type,
                    hp: 1, color: '#888', rotation: Math.random() * Math.PI * 2
                });
            }

            // Powerups
            if (Math.random() < 0.002 * effectiveDt) {
                spawnPowerUp(Math.random() * logicWidth, -50);
            }

            // Collision & Logic Loop
            // OPTIMIZATION: Reverse loop for O(1) removal (swap & pop)
            for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
                // eslint-disable-next-line security/detect-object-injection
                const e = enemiesRef.current[i];

                if (e.type === 'homing_mine') {
                    const dx = player.x - e.x;
                    const dy = player.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0 && dist < 400) {
                        e.vx += (dx / dist) * 0.08 * effectiveDt;
                        e.vy += (dy / dist) * 0.08 * effectiveDt;
                    }
                    const currentSpeed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
                    if (currentSpeed > 3.5) {
                        e.vx = (e.vx / currentSpeed) * 3.5;
                        e.vy = (e.vy / currentSpeed) * 3.5;
                    }
                }

                e.y += e.vy * effectiveDt;
                e.x += e.vx * effectiveDt;
                e.rotation += 0.02 * effectiveDt;

                if (e.y > logicHeight + e.height) {
                    // O(1) Removal
                    // eslint-disable-next-line security/detect-object-injection
                    enemiesRef.current[i] = enemiesRef.current[enemiesRef.current.length - 1];
                    enemiesRef.current.pop();
                    setScore(scoreRef.current + 10); scoreRef.current += 10;
                    continue;
                }

                // Collision
                if (!isWarpingRef.current && gracePeriodRef.current <= 0) {
                    const dx = e.x - player.x;
                    const dy = e.y - player.y;
                    const distSq = dx * dx + dy * dy;
                    
                    let isHit = false;
                    let minDist = 0;
                    
                    if (e.type === 'laser_beam') {
                        if (Math.abs(dx) < e.width / 2 + player.width / 2 && dy > -e.height/2 && dy < e.height/2) {
                            isHit = true;
                        }
                    } else {
                        minDist = (e.width / 2 + player.width / 3);
                        if (distSq < minDist * minDist) {
                            isHit = true;
                        } else if (!e.nearMissTriggered && distSq < (minDist * 1.8) * (minDist * 1.8)) {
                            e.nearMissTriggered = true;
                            const newCombo = comboCounterRef.current + 1;
                            comboCounterRef.current = newCombo;
                            setCombo(newCombo);
                            setScore(scoreRef.current + 50 * newCombo);
                            scoreRef.current += 50 * newCombo;
                            spawnFloatingText(e.x, e.y, 'NEAR MISS!', '#00f3ff', 12);
                        }
                    }

                    if (isHit) {
                        comboCounterRef.current = 0;
                        setCombo(0);
                        if (shieldTimerRef.current <= 0) {
                            player.hp -= 34;
                            setHealth(player.hp); lastReportedHealth.current = player.hp;
                            addScreenShake(20);
                            spawnParticle(player.x, player.y, COLORS.danger, 'debris');
                            audioService.playHit();

                            // O(1) Removal
                            // eslint-disable-next-line security/detect-object-injection
                            enemiesRef.current[i] = enemiesRef.current[enemiesRef.current.length - 1];
                            enemiesRef.current.pop();

                            if (player.hp <= 0) {
                                isDeadRef.current = true; // LOCK DEATH
                                onGameOverRef.current(scoreRef.current);
                            }
                        } else {
                            // Shield blocked the asteroid
                            // O(1) Removal
                            // eslint-disable-next-line security/detect-object-injection
                            enemiesRef.current[i] = enemiesRef.current[enemiesRef.current.length - 1];
                            enemiesRef.current.pop();
                            spawnParticle(e.x, e.y, '#00f3ff', 'spark');
                            audioService.playShieldDeflect();
                        }
                    }
                }
            }

            // Powerup Collision
            for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
                const p = powerUpsRef.current[i];
                p.y += p.vy * effectiveDt;

                // OPTIMIZATION: Squared Distance
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                const distSq = dx * dx + dy * dy;
                const minDist = 30 + player.width / 2;

                if (distSq < minDist * minDist) {
                    if (p.type === 'HEALTH') {
                        setHealth(Math.min(100, player.hp + 30));
                        spawnFloatingText(p.x, p.y, '+30 HP', '#B5EAD7');
                        audioService.playPowerUp();
                    } else if (p.type === 'ENERGY') {
                        setEnergy(Math.min(100, energyMeterRef.current + 50));
                        spawnFloatingText(p.x, p.y, 'MAX ENERGY', COLORS.accent);
                        audioService.playPowerUp();
                    } else if (p.type === 'SHIELD') {
                        shieldTimerRef.current = 600; // 10 seconds
                        spawnFloatingText(p.x, p.y, 'SHIELD', '#C7CEEA');
                        audioService.playShield();
                    }
                    // O(1) Removal
                    // eslint-disable-next-line security/detect-object-injection
                    powerUpsRef.current[i] = powerUpsRef.current[powerUpsRef.current.length - 1];
                    powerUpsRef.current.pop();
                } else if (p.y > logicHeight + 50) {
                    // eslint-disable-next-line security/detect-object-injection
                    powerUpsRef.current[i] = powerUpsRef.current[powerUpsRef.current.length - 1];
                    powerUpsRef.current.pop();
                }
            }

            if (gracePeriodRef.current > 0) gracePeriodRef.current -= dt;
            if (shieldTimerRef.current > 0) shieldTimerRef.current -= dt;

            // Level Progress
            levelDistanceRef.current += (10 + levelConfigRef.current.speedMultiplier * 5) * dt;
            const prog = Math.min(100, (levelDistanceRef.current / GOAL_DISTANCE) * 100);
            if (Math.abs(prog - lastReportedProgress.current) > 1) {
                setProgress(prog); lastReportedProgress.current = prog;
            }

            // Warp Logic
            if (prog >= 100 && !isWarpingRef.current && !hasTriggeredCompleteRef.current) {
                isWarpingRef.current = true;
                warpTimerRef.current = 200;
                spawnFloatingText(logicWidth / 2, logicHeight / 2, "WARP ENGAGED", "#00f3ff", 30);
                addScreenShake(30);
                audioService.playWarp();
            }

            if (isWarpingRef.current) {
                warpTimerRef.current -= dt;
                if (warpTimerRef.current <= 0 && !hasTriggeredCompleteRef.current) {
                    hasTriggeredCompleteRef.current = true;
                    onLevelCompleteRef.current();
                }
            }

            // Cinematic Autopilot
            if (currentState === GameState.LEVEL_COMPLETE) {
                player.y -= 10 * dt;
            }
        } else {
            // Menu / Paused Animation
            if (currentState === GameState.MENU) {
                player.x = logicWidth / 2 + Math.sin(timestamp * 0.001) * 100;
                player.y = logicHeight / 2 + Math.cos(timestamp * 0.002) * 50;
            } else {
                player.x += (logicWidth / 2 - player.x) * 0.1 * dt;
                if (gameState === GameState.LEVEL_COMPLETE) player.y -= 2 * dt;
                else player.y += (logicHeight / 2 - player.y) * 0.1 * dt;
                enemiesRef.current.forEach(e => e.y += 20 * dt);
            }
        }

        powerUpsRef.current.forEach(p => {
            // OPTIMIZATION: Reduce shadow blur on mobile
            ctx.fillStyle = p.color;
            if (!isMobile) {
                ctx.shadowBlur = 15; ctx.shadowColor = p.color;
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        });

        enemiesRef.current.forEach(e => drawObstacle(ctx, e));

        // Premium Sonic Boom (Multi-layer Shockwaves)
        shockwavesRef.current.forEach((sw, i) => {
            sw.radius += 20 * dt; sw.life -= 0.04 * dt;
            if (sw.life <= 0) { shockwavesRef.current.splice(i, 1); return; }

            // Triple-layer effect for depth
            const baseAlpha = sw.life * 0.7;

            // Outer expanding ring (white/cyan)
            ctx.strokeStyle = `rgba(180, 255, 255, ${baseAlpha})`;
            ctx.lineWidth = 6;
            // OPTIMIZATION: No shadow on mobile
            if (!isMobile) {
                ctx.shadowColor = '#00f3ff';
                ctx.shadowBlur = 15;
            }
            ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke();

            // Middle ring (cyan, faster)
            ctx.strokeStyle = `rgba(0, 243, 255, ${baseAlpha * 1.2})`;
            ctx.lineWidth = 4;
            if (!isMobile) ctx.shadowBlur = 25;
            ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius * 0.7, 0, Math.PI * 2); ctx.stroke();

            // Inner ring (white, fastest)
            ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha * 1.5})`;
            ctx.lineWidth = 8;
            if (!isMobile) ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius * 0.4, 0, Math.PI * 2); ctx.stroke();

            // Reset shadow
            ctx.shadowBlur = 0;
        });

        drawPlayerJet(ctx, player, isCinematic);

        ctx.globalCompositeOperation = 'lighter';
        // OPTIMIZATION: Render active particles from pool
        // Iterate only through active particles in the ring buffer logic
        // For visual simplicity in this ring buffer implementation, we iterate all and check life
        // A true ring buffer would track head/tail, but checking life is cheap enough for 200 items
        // and avoids complex index management bugs.
        for (let i = 0; i < MAX_PARTICLES; i++) {
            // eslint-disable-next-line security/detect-object-injection
            const p = particlePoolRef.current[i];
            if (p && p.life > 0) {
                p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt;
                if (p.life > 0) {
                    ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

        floatingTextsRef.current.forEach((ft, i) => {
            ft.y += ft.vy * dt; ft.life -= 0.02 * dt;
            if (ft.life <= 0) { floatingTextsRef.current.splice(i, 1); return; }
            ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px monospace`; ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1;

        // OPTIMIZATION: Remove Vignette on mobile
        if (!isMobile) {
            const vignette = ctx.createRadialGradient(logicWidth / 2, logicHeight / 2, logicWidth / 3, logicWidth / 2, logicHeight / 2, logicWidth);
            vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = vignette; ctx.fillRect(0, 0, logicWidth, logicHeight);
        }

        ctx.restore();
        frameRef.current++;
        requestRef.current = requestAnimationFrame(loop);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [loop]);

    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = window.innerWidth * dpr;
                canvasRef.current.height = window.innerHeight * dpr;
                canvasRef.current.style.width = `${window.innerWidth}px`;
                canvasRef.current.style.height = `${window.innerHeight}px`;
            }
        };
        window.addEventListener('resize', resize); resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        if (backgroundInitialized.current) return;
        const w = window.innerWidth; const h = window.innerHeight;
        nebulasRef.current = Array.from({ length: 5 }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            size: 300 + Math.random() * 400,
            // eslint-disable-next-line security/detect-object-injection
            color: ['rgba(100, 0, 255, 0.3)', 'rgba(0, 100, 255, 0.3)', 'rgba(255, 0, 100, 0.2)'][Math.floor(Math.random() * 3)],
            speed: 0.2 + Math.random() * 0.5
        }));
        starsRef.current = Array.from({ length: 250 }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            z: Math.random() * 2 + 0.1, size: Math.random() * 1.2 + 0.3, brightness: Math.random()
        }));
        backgroundInitialized.current = true;
    }, []);

    return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;