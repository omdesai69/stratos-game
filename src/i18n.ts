import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Initiating Hyperjump": "Initiating Hyperjump",
      "Journey Complete": "Journey Complete",
      "Victory": "Victory",
      "victory_desc": "You've traversed the cosmos, navigated through 100 sectors of deep space, and reached your destination.",
      "Final Score": "Final Score",
      "Return to Main Menu": "Return to Main Menu",
      "Terminated": "Terminated",
      "Mission Failure": "Mission Failure",
      "Re-Initialize": "Re-Initialize",
      "Abort to Menu": "Abort to Menu",
      "Score": "Score",
      "Combo": "Combo",
      "Distance to Warp": "Distance to Warp",
      "System Charged": "System Charged",
      "PRESS SPACE": "PRESS SPACE",
      "DOUBLE TAP TO BOOM": "DOUBLE TAP TO BOOM",
      "Integrity": "Integrity",
      "HP": "HP",
      "Hyper-Flux": "Hyper-Flux",
      "FLUX": "FLUX",
      "Focus": "Focus",
      "FCS": "FCS",
      "Simulation Paused": "Simulation Paused",
      "Resume": "Resume",
      "Abort": "Abort",
      "Cleared": "Cleared",
      "Locked": "Locked",
      "Tactical Navigation": "Tactical Navigation",
      "Close": "Close",
      "Mission Accomplished": "Mission Accomplished",
      "Sector ": "Sector ",
      "Total Score": "Total Score",
      "Hull Integrity": "Hull Integrity",
      "Warp to Next Sector": "Warp to Next Sector",
      "Return to Base": "Return to Base",
      "STRATOS": "STRATOS",
      "Hyper-Kinetic Avoider": "Hyper-Kinetic Avoider",
      "INITIATE": "INITIATE",
      "CAMPAIGN": "CAMPAIGN",
      "WASD": "WASD",
      "SHIFT": "SHIFT",
      "SPACE": "SPACE",
      "Move": "Move",
      "FocusAction": "Focus",
      "Sonic Boom": "Sonic Boom",
      "+30 HP": "+30 HP",
      "MAX ENERGY": "MAX ENERGY",
      "SHIELD": "SHIELD"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
