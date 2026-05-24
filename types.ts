
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  MAP = 'MAP',
  VICTORY = 'VICTORY'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'player' | 'enemy_circle' | 'obstacle_hexagon' | 'obstacle_asteroid' | 'homing_mine' | 'laser_beam';
  hp: number;
  color: string;
  rotation: number;
  scale?: number; // For pulsing effects
  nearMissTriggered?: boolean;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'HEALTH' | 'GHOST' | 'SHIELD' | 'ENERGY';
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
  type?: 'glow' | 'spark' | 'debris' | 'ring';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  size: number;
  vy: number;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

export interface NebulaCloud {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

export interface LevelConfig {
  instanceId: string; // CRITICAL: Unique ID for every run to force resets
  levelNumber: number;
  missionName: string;
  description: string;
  themeColor: string;
  obstacleDensity: number;
  speedMultiplier: number;
  hazardType: 'asteroids' | 'debris' | 'mixed';
}
