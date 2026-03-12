import { useEffect, useRef } from 'react';
import { useVowel } from '@vowel.to/client/react';
import useGameStore from './store/gameStore';
import useMultiplayerStore from './store/multiplayerStore';

export function useVowelStateSync() {
  const { client } = useVowel();
  const prevContextRef = useRef(null);

  useEffect(() => {
    if (!client) return;

    const gameStore = useGameStore.getState();
    const multiplayerStore = useMultiplayerStore.getState();

    const buildContext = () => ({
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
        controlsVisible: gameStore.controlsVisible,
      },
      multiplayer: {
        inRoom: multiplayerStore.currentRoom !== null,
        playerCount: multiplayerStore.lobbyPlayerCount,
        playerName: multiplayerStore.playerName,
        remotePlayerCount: Object.keys(multiplayerStore.remotePlayers).length,
      },
      savedVehicles: Object.keys(gameStore.savedVehicles).filter(k => k !== 'current'),
    });

    const context = buildContext();
    const contextString = JSON.stringify(context);
    
    if (prevContextRef.current !== contextString) {
      prevContextRef.current = contextString;
      client.updateContext(context);
    }
  });
}

export function VowelStateSync() {
  useVowelStateSync();
  return null;
}
