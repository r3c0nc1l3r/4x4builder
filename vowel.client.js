import { Vowel, createDirectAdapters } from '@vowel.to/client';
import useGameStore from './store/gameStore';
import useMultiplayerStore from './store/multiplayerStore';

function buildVowelContext() {
  const gameStore = useGameStore.getState();
  const multiplayerStore = useMultiplayerStore.getState();
  
  return {
    route: {
      pathname: window.location.pathname,
      pathnameLabel: window.location.pathname === '/' ? 'Home' : window.location.pathname.slice(1),
      search: window.location.search,
    },
    vehicle: {
      body: gameStore.currentVehicle?.body,
      color: gameStore.currentVehicle?.color,
      lift: gameStore.currentVehicle?.lift,
      rim: gameStore.currentVehicle?.rim,
      tire: gameStore.currentVehicle?.tire,
    },
    ui: {
      muted: gameStore.muted,
      lightsOn: gameStore.lightsOn,
      physicsEnabled: gameStore.physicsEnabled,
      infoMode: gameStore.infoMode,
    },
    multiplayer: {
      inRoom: multiplayerStore.currentRoom !== null,
      playerCount: multiplayerStore.lobbyPlayerCount,
      playerName: multiplayerStore.playerName,
    },
    savedVehicles: Object.keys(gameStore.savedVehicles).filter(k => k !== 'current'),
  };
}

export function createVowelClient(appId, navigate) {
  const { navigationAdapter } = createDirectAdapters({
    navigate,
    routes: [
      { path: '/', description: 'Home - 3D vehicle builder' },
      { path: '/:slug', description: 'Vehicle detail page' },
    ],
    enableAutomation: false,
  });

  const vowel = new Vowel({
    appId: appId,
    instructions: `You are a helpful voice assistant for 4x4builder.com - a 3D vehicle builder for off-road vehicles.

## CRITICAL: Write to App Store, Not DOM
**MOST IMPORTANT RULE**: When performing actions, you MUST write to the application store/state management system, NOT manipulate the DOM directly. Always use registered actions that modify the app store. The UI will automatically update to reflect state changes.

## CRITICAL: Always Refer to Context for Information
Before answering ANY question or performing ANY action, ALWAYS check the <context> section for current information. The context contains the most up-to-date state of the application.

## CRITICAL: Initial Greeting (First Thing You Say)
When you first speak in a new session, you MUST call getAppState() FIRST. The context may not be populated yet - getAppState() reliably returns the current route, vehicle config, UI state, user state, etc. Do NOT rely on context alone for the initial greeting.

## Current Application State:
The current state is automatically provided in the <context> section. You always have access to the latest state - no need to call any actions to read it.

## Available Routes:
- / or /home: Main 3D vehicle builder
- /:slug: Vehicle detail pages

## Available Actions:
### Vehicle Customization:
- changeVehicleBody: Change the vehicle body/model. Parameters: body (vehicle body id like toyota_4runner_5g, jeep_wrangler_jku, etc.)
- changeVehicleColor: Change vehicle paint color. Parameters: color (hex color like #c81414, #1a1a1a, etc.)
- changeLift: Change vehicle lift height. Parameters: lift (0-5 inches)
- changeWheels: Change wheels/rims. Parameters: rim (rim id), tire (tire id)
- toggleLights: Toggle vehicle lights on/off

### Save/Load:
- saveCurrentVehicle: Save current vehicle configuration. Parameters: name (optional save name)
- loadVehicle: Load a saved vehicle. Parameters: vehicleId (the saved vehicle id)
- deleteVehicle: Delete a saved vehicle. Parameters: vehicleId (the saved vehicle id)
- getSavedVehicles: Get list of saved vehicles

### Audio:
- toggleMute: Toggle audio mute on/off
- playHorn: Honk the vehicle horn

### Camera:
- changeCameraMode: Change camera view. Parameters: mode (orbit or firstPerson)
- toggleCameraAutoRotate: Toggle camera auto-rotate

### Multiplayer:
- joinMultiplayer: Join multiplayer lobby/room. Parameters: roomId (optional room code)
- leaveMultiplayer: Leave current multiplayer room
- sendChatMessage: Send chat message. Parameters: text

## How to Use:
- To customize: Say "change color to red" or "change wheels to Method 305"
- To save: Say "save my build" or "save as [name]"
- To load: Say "load my [vehicle name] build"
- To navigate: Say "go to home" or just mention the route
- Audio is handled automatically through the mute toggle

**DO NOT use DOM manipulation** - always use registered actions that write to the store.`,

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
      initialGreetingPrompt: `Welcome to 4x4builder! Your personal off-road vehicle configurator. I can help you customize vehicles, save builds, and explore different configurations. Call getAppState() to see the current vehicle and state, then ask what you'd like to do - change colors, swap wheels, add lifts, or save your build!`,
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
  vowel.updateContext(buildVowelContext());
  return vowel;
}

function registerCustomActions(vowel) {
  vowel.registerAction('getAppState', {
    description: 'Get current route, vehicle config, UI state, and saved vehicles. CALL THIS FIRST when starting a new session (initial greeting) - context may not be populated yet.',
    parameters: {},
  }, async () => {
    return { success: true, ...buildVowelContext() };
  });

  vowel.registerAction('changeVehicleBody', {
    description: 'Change the vehicle body/model',
    parameters: {
      body: { type: 'string', description: 'Vehicle body ID (e.g., toyota_4runner_5g, jeep_wrangler_jku, ford_bronco_6g, toyota_tacoma_2g_ac, etc.)' },
    },
  }, async ({ body }) => {
    useGameStore.getState().setVehicle({ body });
    return { success: true, message: `Changed vehicle to ${body}` };
  });

  vowel.registerAction('changeVehicleColor', {
    description: 'Change vehicle paint color',
    parameters: {
      color: { type: 'string', description: 'Hex color code (e.g., #c81414, #1a1a1a, #ffffff, #2563eb)' },
    },
  }, async ({ color }) => {
    useGameStore.getState().setVehicle({ color });
    return { success: true, message: `Changed color to ${color}` };
  });

  vowel.registerAction('changeLift', {
    description: 'Change vehicle lift height',
    parameters: {
      lift: { type: 'number', description: 'Lift height in inches (0-5)' },
    },
  }, async ({ lift }) => {
    const validLift = Math.max(0, Math.min(5, lift));
    useGameStore.getState().setVehicle({ lift: validLift });
    return { success: true, message: `Changed lift to ${validLift} inches` };
  });

  vowel.registerAction('changeWheels', {
    description: 'Change wheels and tires',
    parameters: {
      rim: { type: 'string', description: 'Rim ID (e.g., method_703, kmc_terra, ford_bronco)', optional: true },
      tire: { type: 'string', description: 'Tire ID (e.g., bfg_at, nitto_mud_grappler, bfg_km3)', optional: true },
    },
  }, async ({ rim, tire }) => {
    const updates = {};
    if (rim) updates.rim = rim;
    if (tire) updates.tire = tire;
    useGameStore.getState().setVehicle(updates);
    return { success: true, message: `Updated wheels: ${rim || 'unchanged'}, ${tire || 'unchanged'}` };
  });

  vowel.registerAction('toggleLights', {
    description: 'Toggle vehicle lights on/off',
    parameters: {},
  }, async () => {
    useGameStore.getState().toggleLights();
    const lightsOn = useGameStore.getState().lightsOn;
    return { success: true, message: lightsOn ? 'Lights turned on' : 'Lights turned off' };
  });

  vowel.registerAction('saveCurrentVehicle', {
    description: 'Save current vehicle configuration',
    parameters: {
      name: { type: 'string', description: 'Optional name for the save', optional: true },
    },
  }, async ({ name }) => {
    const state = useGameStore.getState();
    const currentVehicle = state.currentVehicle;
    const saveId = name || `build_${Date.now()}`;
    
    const vehicles = { ...state.savedVehicles };
    vehicles[saveId] = { config: currentVehicle };
    vehicles.current = saveId;
    state.setSavedVehicles(vehicles);
    
    return { success: true, message: `Saved vehicle as "${saveId}"` };
  });

  vowel.registerAction('loadVehicle', {
    description: 'Load a saved vehicle configuration',
    parameters: {
      vehicleId: { type: 'string', description: 'The saved vehicle ID to load' },
    },
  }, async ({ vehicleId }) => {
    const state = useGameStore.getState();
    const vehicles = state.savedVehicles;
    
    if (!vehicles[vehicleId]) {
      return { success: false, message: `Vehicle "${vehicleId}" not found` };
    }
    
    state.setVehicle(vehicles[vehicleId].config);
    return { success: true, message: `Loaded "${vehicleId}"` };
  });

  vowel.registerAction('deleteVehicle', {
    description: 'Delete a saved vehicle configuration',
    parameters: {
      vehicleId: { type: 'string', description: 'The saved vehicle ID to delete' },
    },
  }, async ({ vehicleId }) => {
    const state = useGameStore.getState();
    state.deleteSavedVehicle(vehicleId);
    return { success: true, message: `Deleted "${vehicleId}"` };
  });

  vowel.registerAction('getSavedVehicles', {
    description: 'Get list of all saved vehicles',
    parameters: {},
  }, async () => {
    const state = useGameStore.getState();
    const vehicles = Object.keys(state.savedVehicles).filter(k => k !== 'current');
    return { success: true, vehicles };
  });

  vowel.registerAction('toggleMute', {
    description: 'Toggle audio mute on/off',
    parameters: {},
  }, async () => {
    useGameStore.getState().toggleMute();
    const muted = useGameStore.getState().muted;
    return { success: true, message: muted ? 'Audio muted' : 'Audio unmuted' };
  });

  vowel.registerAction('playHorn', {
    description: 'Honk the vehicle horn',
    parameters: {},
  }, async () => {
    useGameStore.getState().setHornActive(true);
    setTimeout(() => {
      useGameStore.getState().setHornActive(false);
    }, 500);
    return { success: true, message: 'Honk!' };
  });

  vowel.registerAction('changeCameraMode', {
    description: 'Change camera view mode',
    parameters: {
      mode: { type: 'string', description: 'Camera mode: orbit or firstPerson' },
    },
  }, async ({ mode }) => {
    if (mode !== 'orbit' && mode !== 'firstPerson') {
      return { success: false, message: 'Invalid camera mode. Use "orbit" or "firstPerson"' };
    }
    useGameStore.getState().setCameraMode(mode);
    return { success: true, message: `Camera changed to ${mode}` };
  });

  vowel.registerAction('toggleCameraAutoRotate', {
    description: 'Toggle camera auto-rotate',
    parameters: {},
  }, async () => {
    const current = useGameStore.getState().cameraAutoRotate;
    useGameStore.getState().setCameraAutoRotate(!current);
    return { success: true, message: !current ? 'Auto-rotate enabled' : 'Auto-rotate disabled' };
  });

  vowel.registerAction('joinMultiplayer', {
    description: 'Join multiplayer lobby/room',
    parameters: {
      roomId: { type: 'string', description: 'Optional room code to join', optional: true },
    },
  }, async ({ roomId }) => {
    const success = await useMultiplayerStore.getState().joinRoom(roomId || undefined);
    return { success, message: success ? 'Joined multiplayer room' : 'Failed to join room' };
  });

  vowel.registerAction('leaveMultiplayer', {
    description: 'Leave current multiplayer room',
    parameters: {},
  }, async () => {
    useMultiplayerStore.getState().leaveRoom();
    return { success: true, message: 'Left multiplayer room' };
  });

  vowel.registerAction('sendChatMessage', {
    description: 'Send chat message in multiplayer',
    parameters: {
      text: { type: 'string', description: 'Message text to send' },
    },
  }, async ({ text }) => {
    useMultiplayerStore.getState().sendChatMessage(text);
    return { success: true, message: 'Message sent' };
  });
}
