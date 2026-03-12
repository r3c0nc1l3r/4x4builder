import React, { useEffect, useState, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import App from './components/App'
import { setAppId, getVowel, subscribeToVowelChanges, updateVowelContext } from './vowel.client'
import useGameStore from './store/gameStore'

import './assets/styles/global.css'

function VowelInit() {
  const navigate = useNavigate()
  const location = useLocation()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const appId = import.meta.env.VITE_VOWEL_APP_ID
    if (appId && !initialized) {
      setAppId(appId, navigate, location)
      setInitialized(true)
    }
  }, [navigate, location, initialized])

  return null
}

function VowelStateSync() {
  const currentVehicle = useGameStore((state) => state.currentVehicle)
  const physicsEnabled = useGameStore((state) => state.physicsEnabled)
  const savedVehicles = useGameStore((state) => state.savedVehicles)
  const location = useLocation()

  useEffect(() => {
    const context = {
      route: {
        pathname: location.pathname,
        slug: location.params?.slug || null,
      },
      vehicle: {
        body: currentVehicle?.body || 'toyota_4runner_5g',
        lift: currentVehicle?.lift || 0,
        color: currentVehicle?.color || '#c81414',
        rim: currentVehicle?.rim || 'toyota_4runner_5thgen',
        tire: currentVehicle?.tire || 'bfg_at',
        tire_diameter: currentVehicle?.tire_diameter || 32,
        addons: currentVehicle?.addons || {},
        lighting: currentVehicle?.lighting || {},
      },
      simulation: {
        physicsEnabled,
      },
      savedVehicles: Object.keys(savedVehicles || {}).filter(k => k !== 'current'),
    }
    updateVowelContext(context)
  }, [currentVehicle, physicsEnabled, savedVehicles, location])

  return null
}

function Layout() {
  const [vowel, setVowel] = useState(getVowel())
  const appId = import.meta.env.VITE_VOWEL_APP_ID

  useEffect(() => {
    const unsubscribe = subscribeToVowelChanges((client) => {
      setVowel(client)
    })
    return () => unsubscribe()
  }, [])

  const vowelReady = vowel !== null || !appId

  return (
    <VowelProvider client={vowel}>
      <VowelStateSync />
      <App />
      {vowelReady && <VowelAgent position="bottom-right" enableFloatingCursor={false} />}
    </VowelProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <VowelInit />
            <Routes>
                <Route path="/" element={<Layout />} />
                <Route path="/:slug" element={<Layout />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
