import { Vowel, createReactRouterAdapters } from '@vowel.to/client';
import useGameStore from './store/gameStore';

let vowelInstance = null;
let currentAppId = null;

const vowelChangeListeners = new Set();

function createVowelClient(appId, navigate, location) {
  const { navigationAdapter } = createReactRouterAdapters({
    navigate,
    location,
    routes: [
      { path: '/', description: '4x4 Builder home - vehicle configurator' },
      { path: '/:slug', description: 'Vehicle configuration page' },
    ],
    enableAutomation: false,
  });

  const vowel = new Vowel({
    appId: appId,
    instructions: `You are a helpful 4x4 off-road vehicle configuration assistant for 4x4 Builder. 

## CRITICAL: Write to App Store, Not DOM
**MOST IMPORTANT RULE**: When performing actions, you MUST write to the application store/state management system, NOT manipulate the DOM directly. Always use registered actions that modify the app store. The UI will automatically update to reflect state changes.

## CRITICAL: Always Refer to Context for Information
Before answering ANY question or performing ANY action, ALWAYS check the <context> section for current information. The context contains the most up-to-date state of the application.

## Current Application State:
The current vehicle configuration is automatically provided in the <context> section. You always have access to the latest configuration state.

## Available Actions:
- getVehicleState: Get current vehicle configuration (body, lift, wheels, tires, color, addons)
- selectVehicle: Select vehicle body (e.g., toyota_4runner_5g, toyota_tacoma, jeep_wrangler_jk, land_cruiser_j250)
- setLift: Set suspension lift height (0-6 inches)
- setColor: Set vehicle body color (hex code like #c81414, #1e3a5f, #2d2d2d)
- setRim: Set wheel rim style
- setTire: Set tire model
- setTireSize: Set tire diameter (28-40 inches)
- toggleAddon: Toggle vehicle addons (bumper, snorkel, rack, etc.)
- toggleLighting: Toggle vehicle lighting options
- startDrive: Enable physics to start driving simulation
- stopDrive: Disable physics to stop driving
- saveVehicle: Save current vehicle configuration
- loadVehicle: Load a previously saved vehicle

## Available Vehicles:
- Toyota 4Runner (5th gen)
- Toyota Tacoma
- Toyota Land Cruiser (J250)
- Jeep Wrangler (JK, YJ)
- Ford Bronco
- Land Cruiser (J80)

## How to Help Users:
- Guide users through customizing their dream 4x4
- Explain different vehicle options and modifications
- Help them choose wheels, tires, suspension lifts
- Explain how add-ons work (bumpers, racks, snorkels)
- Assist with driving controls and camera modes
- Explain how to save and load vehicle configurations

Always modify state through registered actions, never manipulate DOM directly.`,
    navigationAdapter,
    floatingCursor: { enabled: false },
    borderGlow: {
      enabled: true,
      color: 'rgba(99, 102, 241, 0.5)',
      intensity: 30,
      pulse: true,
    },
    _caption: {
      enabled: true,
      position: 'top-center',
      maxWidth: '600px',
      showRole: true,
      showOnMobile: false,
    },
    voiceConfig: {
      provider: 'vowel-prime',
      vowelPrimeConfig: { environment: 'staging' },
      llmProvider: 'groq',
      model: 'openai/gpt-oss-120b',
      voice: 'Timothy',
      language: 'en-US',
      initialGreetingPrompt: `Welcome to 4x4 Builder! I'm your off-road vehicle configuration assistant. I can help you build your dream 4x4 - choose from vehicles like Toyota 4Runner, Tacoma, Land Cruiser, Jeep Wrangler, or Ford Bronco. Customize wheels, tires, suspension lift up to 6 inches, and add accessories like bumpers, roof racks, and snorkels. You can also save your configurations to load later. What kind of vehicle would you like to build today?`,
    },
    onUserSpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🗣️ User started speaking' : '🔇 User stopped speaking');
    },
    onAIThinkingChange: (isThinking) => {
      console.log(isThinking ? '🧠 AI started thinking' : '💭 AI stopped thinking');
    },
    onAISpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🔊 AI started speaking' : '🔇 AI stopped speaking');
    },
  });

  registerCustomActions(vowel);
  return vowel;
}

function registerCustomActions(vowel) {
  vowel.registerAction('getVehicleState', {
    description: 'Get current vehicle configuration state including body, lift, wheels, tires, color, and addons',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    return {
      success: true,
      vehicle: state.currentVehicle,
      physicsEnabled: state.physicsEnabled,
      savedVehicles: Object.keys(state.savedVehicles || {}).filter(k => k !== 'current'),
    };
  });

  vowel.registerAction('selectVehicle', {
    description: 'Select vehicle body type',
    parameters: {
      body: { type: 'string', description: 'Vehicle body ID (e.g., toyota_4runner_5g, toyota_tacoma, jeep_wrangler_jk, land_cruiser_j250, ford_bronco)' },
    },
  }, async ({ body }) => {
    useGameStore.getState().setVehicle({ body });
    return { success: true, message: `Selected ${body}` };
  });

  vowel.registerAction('setLift', {
    description: 'Set suspension lift height in inches',
    parameters: {
      lift: { type: 'number', description: 'Lift height from 0-6 inches' },
    },
  }, async ({ lift }) => {
    const clampedLift = Math.max(0, Math.min(6, lift));
    useGameStore.getState().setVehicle({ lift: clampedLift });
    return { success: true, message: `Set ${clampedLift}" lift` };
  });

  vowel.registerAction('setColor', {
    description: 'Set vehicle body color',
    parameters: {
      color: { type: 'string', description: 'Hex color code (e.g., #c81414, #1e3a5f, #2d2d2d, #ffffff)' },
    },
  }, async ({ color }) => {
    useGameStore.getState().setVehicle({ color });
    return { success: true, message: `Set color to ${color}` };
  });

  vowel.registerAction('setRim', {
    description: 'Set wheel rim style',
    parameters: {
      rim: { type: 'string', description: 'Rim ID (e.g., toyota_4runner_5thgen, american_racing, konig, cragar)' },
    },
  }, async ({ rim }) => {
    useGameStore.getState().setVehicle({ rim });
    return { success: true, message: `Set rims to ${rim}` };
  });

  vowel.registerAction('setTire', {
    description: 'Set tire model',
    parameters: {
      tire: { type: 'string', description: 'Tire ID (e.g., bfg_at, bfg_km3, bfg_km2, nitto_mud_grappler, maxxis_trepador)' },
    },
  }, async ({ tire }) => {
    useGameStore.getState().setVehicle({ tire });
    return { success: true, message: `Set tires to ${tire}` };
  });

  vowel.registerAction('setTireSize', {
    description: 'Set tire diameter in inches',
    parameters: {
      diameter: { type: 'number', description: 'Tire diameter from 28-40 inches' },
    },
  }, async ({ diameter }) => {
    const clampedDiameter = Math.max(28, Math.min(40, diameter));
    useGameStore.getState().setVehicle({ tire_diameter: clampedDiameter });
    return { success: true, message: `Set tire size to ${clampedDiameter}"` };
  });

  vowel.registerAction('setRimDiameter', {
    description: 'Set rim diameter in inches',
    parameters: {
      diameter: { type: 'number', description: 'Rim diameter from 15-22 inches' },
    },
  }, async ({ diameter }) => {
    const clampedDiameter = Math.max(15, Math.min(22, diameter));
    useGameStore.getState().setVehicle({ rim_diameter: clampedDiameter });
    return { success: true, message: `Set rim diameter to ${clampedDiameter}"` };
  });

  vowel.registerAction('setRimWidth', {
    description: 'Set rim width in inches',
    parameters: {
      width: { type: 'number', description: 'Rim width from 8-12 inches' },
    },
  }, async ({ width }) => {
    const clampedWidth = Math.max(8, Math.min(12, width));
    useGameStore.getState().setVehicle({ rim_width: clampedWidth });
    return { success: true, message: `Set rim width to ${clampedWidth}"` };
  });

  vowel.registerAction('setRimColor', {
    description: 'Set rim color',
    parameters: {
      color: { type: 'string', description: 'Rim color (e.g., silver, black, chrome, bronze)' },
    },
  }, async ({ color }) => {
    useGameStore.getState().setVehicle({ rim_color: color });
    return { success: true, message: `Set rim color to ${color}` };
  });

  vowel.registerAction('setWheelOffset', {
    description: 'Set wheel offset in mm',
    parameters: {
      offset: { type: 'number', description: 'Wheel offset from -20 to 50mm' },
    },
  }, async ({ offset }) => {
    const clampedOffset = Math.max(-20, Math.min(50, offset));
    useGameStore.getState().setVehicle({ wheel_offset: clampedOffset });
    return { success: true, message: `Set wheel offset to ${clampedOffset}mm` };
  });

  vowel.registerAction('setTireMuddiness', {
    description: 'Set tire muddiness level (0 = clean, 1 = very muddy)',
    parameters: {
      level: { type: 'number', description: 'Muddiness level from 0-1' },
    },
  }, async ({ level }) => {
    const clampedLevel = Math.max(0, Math.min(1, level));
    useGameStore.getState().setVehicle({ tire_muddiness: clampedLevel });
    return { success: true, message: `Set tire muddiness to ${Math.round(clampedLevel * 100)}%` };
  });

  vowel.registerAction('setRoughness', {
    description: 'Set paint roughness/matte level (0 = glossy, 1 = matte)',
    parameters: {
      level: { type: 'number', description: 'Roughness level from 0-1' },
    },
  }, async ({ level }) => {
    const clampedLevel = Math.max(0, Math.min(1, level));
    useGameStore.getState().setVehicle({ roughness: clampedLevel });
    return { success: true, message: `Set paint roughness to ${Math.round(clampedLevel * 100)}%` };
  });

  vowel.registerAction('toggleAddon', {
    description: 'Toggle vehicle addon (bumper, snorkel, rack, ladder, running boards)',
    parameters: {
      addon: { type: 'string', description: 'Addon ID (e.g., bumper_f, snorkel, rack, ladder, running_boards)' },
    },
  }, async ({ addon }) => {
    const state = useGameStore.getState();
    const currentAddons = { ...state.currentVehicle.addons };
    if (currentAddons[addon]) {
      delete currentAddons[addon];
    } else {
      currentAddons[addon] = true;
    }
    state.setVehicle({ addons: currentAddons });
    return { success: true, message: `Toggled ${addon}` };
  });

  vowel.registerAction('toggleLighting', {
    description: 'Toggle vehicle lighting (lightbar, etc)',
    parameters: {
      light: { type: 'string', description: 'Light ID to toggle' },
    },
  }, async ({ light }) => {
    const state = useGameStore.getState();
    const currentLighting = { ...state.currentVehicle.lighting };
    if (currentLighting[light]) {
      delete currentLighting[light];
    } else {
      currentLighting[light] = true;
    }
    state.setVehicle({ lighting: currentLighting });
    return { success: true, message: `Toggled ${light}` };
  });

  vowel.registerAction('toggleSpare', {
    description: 'Toggle spare tire carrier',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    state.setVehicle({ spare: !state.currentVehicle.spare });
    return { success: true, message: state.currentVehicle.spare ? 'Spare tire enabled' : 'Spare tire disabled' };
  });

  vowel.registerAction('startDrive', {
    description: 'Enable physics to start driving simulation',
    parameters: {},
  }, async () => {
    useGameStore.getState().setPhysicsEnabled(true);
    return { success: true, message: 'Physics enabled - start driving!' };
  });

  vowel.registerAction('stopDrive', {
    description: 'Disable physics to stop driving simulation',
    parameters: {},
  }, async () => {
    useGameStore.getState().setPhysicsEnabled(false);
    return { success: true, message: 'Physics disabled' };
  });

  vowel.registerAction('saveVehicle', {
    description: 'Save current vehicle configuration',
    parameters: {
      name: { type: 'string', description: 'Name for the saved vehicle' },
    },
  }, async ({ name }) => {
    const state = useGameStore.getState();
    const vehicleId = name?.toLowerCase().replace(/\s+/g, '_') || `vehicle_${Date.now()}`;
    state.setSavedVehicles((vehicles) => ({
      ...vehicles,
      [vehicleId]: {
        name: name || vehicleId,
        config: { ...state.currentVehicle },
      },
      current: vehicleId,
    }));
    return { success: true, message: `Saved vehicle as "${name || vehicleId}"` };
  });

  vowel.registerAction('loadVehicle', {
    description: 'Load a previously saved vehicle',
    parameters: {
      vehicleId: { type: 'string', description: 'ID of saved vehicle to load' },
    },
  }, async ({ vehicleId }) => {
    const state = useGameStore.getState();
    const savedVehicles = state.savedVehicles;
    if (savedVehicles[vehicleId]) {
      state.setSavedVehicles((vehicles) => ({
        ...vehicles,
        current: vehicleId,
      }));
      return { success: true, message: `Loaded "${savedVehicles[vehicleId].name}"` };
    }
    return { success: false, message: `Vehicle "${vehicleId}" not found` };
  });

  vowel.registerAction('deleteVehicle', {
    description: 'Delete a saved vehicle configuration',
    parameters: {
      vehicleId: { type: 'string', description: 'ID of saved vehicle to delete' },
    },
  }, async ({ vehicleId }) => {
    const state = useGameStore.getState();
    if (state.savedVehicles[vehicleId]) {
      state.deleteSavedVehicle(vehicleId);
      return { success: true, message: `Deleted "${vehicleId}"` };
    }
    return { success: false, message: `Vehicle "${vehicleId}" not found` };
  });

  vowel.registerAction('resetVehicle', {
    description: 'Reset vehicle to default configuration',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    const defaults = {
      body: 'toyota_4runner_5g',
      lift: 0,
      color: '#c81414',
      roughness: 0,
      addons: {},
      lighting: {},
      wheel_offset: 0,
      rim: 'toyota_4runner_5thgen',
      rim_color: 'silver',
      rim_color_secondary: 'silver',
      rim_diameter: 17,
      rim_width: 10,
      tire: 'bfg_at',
      tire_diameter: 32,
      tire_muddiness: 0,
      spare: false,
    };
    state.setVehicle(defaults);
    return { success: true, message: 'Vehicle reset to defaults' };
  });

  vowel.registerAction('toggleMute', {
    description: 'Toggle audio mute',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    state.toggleMute();
    return { success: true, message: state.muted ? 'Audio muted' : 'Audio unmuted' };
  });

  vowel.registerAction('toggleLights', {
    description: 'Toggle vehicle lights',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    state.toggleLights();
    return { success: true, message: state.lightsOn ? 'Lights on' : 'Lights off' };
  });

  vowel.registerAction('cycleCamera', {
    description: 'Cycle through camera modes (orbit, firstPerson)',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    const modes = ['orbit', 'firstPerson'];
    const currentIndex = modes.indexOf(state.cameraMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    state.setCameraMode(modes[nextIndex]);
    return { success: true, message: `Camera mode: ${modes[nextIndex]}` };
  });

  vowel.registerAction('toggleAutoRotate', {
    description: 'Toggle camera auto-rotate',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    state.setCameraAutoRotate(!state.cameraAutoRotate);
    return { success: true, message: state.cameraAutoRotate ? 'Auto-rotate on' : 'Auto-rotate off' };
  });
}

export function setAppId(appId, navigate, location) {
  if (!appId) return;
  currentAppId = appId;
  vowelInstance = createVowelClient(appId, navigate, location);
  console.log('✅ Vowel client initialized with App ID:', appId);
  vowelChangeListeners.forEach((listener) => listener(vowelInstance));
}

export function getVowel() {
  return vowelInstance;
}

export function subscribeToVowelChanges(listener) {
  vowelChangeListeners.add(listener);
  if (vowelInstance) {
    listener(vowelInstance);
  }
  return () => vowelChangeListeners.delete(listener);
}

export function updateVowelContext(context) {
  if (vowelInstance) {
    vowelInstance.updateContext(context);
  }
}
