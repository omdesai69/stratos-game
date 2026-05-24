
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LevelConfig } from '../types';
import { DEFAULT_LEVEL_CONFIG } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLevelDetails = async (level: number): Promise<LevelConfig> => {
  const instanceId = `level-${level}-${Date.now()}`; // Unique ID for this run

  if (!process.env.API_KEY) {
    return getProceduralLevel(level);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a configuration for Level ${level} of a high-speed sci-fi obstacle avoidance game.
      The player cannot shoot, only dodge. 
      Levels 1-10 are easy. Levels 50+ are extremely hard.
      obstacleDensity: 1.0 is normal, 2.5 is extremely dense.
      speedMultiplier: 1.0 is normal, 2.5 is hypersonic.
      Return a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            missionName: { type: Type.STRING, description: "A cool sci-fi sector name" },
            description: { type: Type.STRING, description: "A 1-sentence warning about the hazards" },
            themeColor: { type: Type.STRING, description: "Hex color code (e.g., #FF00FF)" },
            obstacleDensity: { type: Type.NUMBER, description: "Float between 0.8 (sparse) and 3.0 (wall of death)" },
            speedMultiplier: { type: Type.NUMBER, description: "Float between 1.0 and 3.0" },
            hazardType: { type: Type.STRING, enum: ["asteroids", "debris", "mixed"] }
          },
          required: ["missionName", "description", "themeColor", "obstacleDensity", "speedMultiplier", "hazardType"]
        } as Schema
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        instanceId,
        levelNumber: level,
        ...data
      };
    }
    throw new Error("Empty response");
  } catch (error) {
    return getProceduralLevel(level);
  }
};

// Unique sector names for immersion
const SECTOR_NAMES = [
  "Genesis Drift", "Nebula's Edge", "Crimson Expanse", "Void Walker", "Aurora Gate",
  "Shadow Nexus", "Stellar Forge", "Quantum Reach", "Crystal Veil", "Iron Crown",
  "Ghost Protocol", "Titan's Wake", "Echo Chamber", "Plasma Ridge", "Starfall Zone",
  "Neon Horizon", "Dark Matter Bay", "Celestial Tomb", "Ion Cascade", "Pulsar Depths",
  "Zero Point", "Warp Anomaly", "Photon Trail", "Gravity Well", "Cosmic Rift",
  "Singularity Arc", "Helios Gate", "Frozen Void", "Thunder Flats", "Astral Maze",
  "Comet's Path", "Binary Stars", "Event Horizon", "Radiant Expanse", "Abyssal Edge",
  "Fracture Line", "Phantom Sector", "Storm Front", "Nova Cluster", "Temporal Breach",
  "Silent Orbit", "Meteor Graveyard", "Hyperspace Lane", "Obsidian Field", "Prism Array",
  "Wormhole Junction", "Void Beacon", "Starlight Corridor", "Gamma Surge", "Entropy Zone",
  "Neutron Field", "Astro Nexus", "Dark Expanse", "Solar Winds", "Cosmic Highway",
  "Gravity Slingshot", "Nebula Core", "Void Pillar", "Stellar Remnant", "Event Gate",
  "Plasma Ocean", "Quasar Point", "Dead Space", "Fusion Reach", "Infinite Loop",
  "Chaos Sector", "Warp Beacon", "Void Passage", "Stellar Trench", "Blackout Zone",
  "Photon Storm", "Drift Passage", "Gravity Nexus", "Deep Void", "Cosmic Junction",
  "Star Forge", "Horizon's End", "Infinity Gate", "Void Cascade", "Plasma Vortex",
  "Quantum Storm", "Dark Passage", "Stellar Abyss", "Warp Corridor", "Final Frontier",
  "Omega Sector", "Beyond Point", "Event Matrix", "Void Singularity", "Hyperspace Core",
  "Neutron Storm", "Galaxy's Edge", "Eternal Void", "Stellar Gate", "Cosmic Terminus",
  "Void Nexus", "Space Drift", "Beyond Limit", "Final Gate", "Ultimate Horizon"
];

export const getProceduralLevel = (level: number): LevelConfig => {
  const instanceId = `level-${level}-${Date.now()}`;
  const themes = ['#00f3ff', '#ff0055', '#bc13fe', '#50ff00', '#ff8800', '#00ccff', '#ff3333', '#ffff00'];
  const hazards: Array<'asteroids' | 'debris' | 'mixed'> = ['asteroids', 'debris', 'mixed'];

  // Ultra-gentle Scaling - reduced by another 5%
  const density = Math.min(4.0, 0.9 + (level * 0.0085)); // Was 0.009
  const speed = Math.min(3.0, 1.0 + (level * 0.0067)); // Was 0.007

  // Get unique sector name
  const sectorName = level <= 100 ? SECTOR_NAMES[level - 1] : `Deep Space ${level - 100}`;
  const description = level < 10 ? "Patrol route - minimal hazards." :
    level < 50 ? "Increased debris field detected." :
      level < 80 ? "High-velocity obstacle zone." :
        "Extreme danger - maximum hazards.";

  return {
    instanceId,
    levelNumber: level,
    missionName: sectorName,
    description,
    themeColor: themes[level % themes.length],
    obstacleDensity: density,
    speedMultiplier: speed,
    hazardType: hazards[level % 3]
  };
};
