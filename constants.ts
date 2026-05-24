
export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const PLAYER_SPEED = 11; 
export const PLAYER_SIZE = 30; 

// Premium Pastel Palette
export const THEME_COLORS = [
  '#FFB7B2', // Pastel Red
  '#B5EAD7', // Pastel Mint
  '#C7CEEA', // Pastel Periwinkle
  '#E2F0CB', // Pastel Lime
  '#E0BBE4', // Pastel Lavender
  '#FF9AA2', // Salmon
];

export const COLORS = {
  primary: '#ffffff',
  accent: '#00f3ff', // Cyan for Energy
  danger: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  void: '#050505',
  glass: 'rgba(255, 255, 255, 0.1)',
  combo: '#FFD700' // Gold
};

export const DEFAULT_LEVEL_CONFIG = {
  instanceId: 'init-0',
  levelNumber: 1,
  missionName: "Sector 01",
  description: "Airspace lightly contested. cleared for takeoff.",
  themeColor: '#C7CEEA',
  obstacleDensity: 1.0,
  speedMultiplier: 1.0,
  hazardType: 'mixed'
} as const;
