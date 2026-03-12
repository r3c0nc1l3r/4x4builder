import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import useGameStore from '../store/gameStore'
import useVehicleFromUrl from '../hooks/useVehicleFromUrl'
import { createVowelClient } from '../vowel.client'
import { VowelStateSync } from '../vowel.state'

import Header from './ui/Header'
import Sidebar from './ui/Sidebar'
import Canvas from './scene/Canvas'
import Actions from './ui/Actions'
import Speedometer from './ui/Speedometer'
import Notification from './ui/Notification'
import ControlsOverlay from './ui/ControlsOverlay'
import Chat from './ui/Chat'
import VehicleInfo from './ui/VehicleInfo'

export default function App() {
	const infoMode = useGameStore((state) => state.infoMode)
	const navigate = useNavigate()
	const appId = import.meta.env.VITE_VOWEL_APP_ID

	const vowel = useMemo(() => {
		if (!appId) return null;
		return createVowelClient(appId, navigate);
	}, [appId, navigate]);

	useVehicleFromUrl()

	return (
		<VowelProvider client={vowel}>
			<VowelStateSync />
			<div className='App'>
				<Canvas />

				{/* UI Components */}
				{infoMode ? null : (
					<>
						<Header />
						<Sidebar />
						<Speedometer />
						<Actions />
						<ControlsOverlay />
						<Chat />
					</>
				)}

				{/* Vehicle Info overlay */}
				<VehicleInfo />

				<Notification />
			</div>
			{vowel && <VowelAgent position='bottom-right' enableFloatingCursor={false} />}
		</VowelProvider>
	)
}
