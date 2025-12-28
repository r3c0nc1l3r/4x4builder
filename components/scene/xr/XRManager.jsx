import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { createXRStore, XR, XROrigin, useXRInputSourceState, useXR } from '@react-three/xr'

import useGameStore from '../../../store/gameStore'
import useInputStore from '../../../store/inputStore'

// Create XR store instance
const xrStore = createXRStore({
	hand: { teleportPointer: true },
	controller: { teleportPointer: true },
	emulate: false,
})

// Fixed XR origin position
const XR_ORIGIN_POSITION = [0, 1.5, 5]

// XR Input Controller - polls XR controllers and updates input store via touchInput
const XRInputController = () => {
	const setTouchInput = useInputStore((state) => state.setTouchInput)

	// Get XR controller states
	const xrLeftController = useXRInputSourceState('controller', 'left')
	const xrRightController = useXRInputSourceState('controller', 'right')

	useFrame(() => {
		if (!xrLeftController && !xrRightController) return

		const xrLeftThumbstick = xrLeftController?.gamepad['xr-standard-thumbstick']
		const xrRightThumbstick = xrRightController?.gamepad['xr-standard-thumbstick']

		// Update touch input with XR controller values
		// This feeds into InputManager's touchInput which combines with other sources
		setTouchInput({
			leftStickX: xrLeftThumbstick?.xAxis ?? 0,
			leftStickY: xrLeftThumbstick?.yAxis ?? 0,
			rightStickX: xrRightThumbstick?.xAxis ?? 0,
			rightStickY: xrRightThumbstick?.yAxis ?? 0,
		})
	})

	return null
}

// Simple fixed XR origin
const XROriginComponent = () => {
	return <XROrigin position={XR_ORIGIN_POSITION} />
}

// XR Session State Tracker - syncs XR session state to gameStore
const XRSessionTracker = () => {
	const setIsInXR = useGameStore((state) => state.setIsInXR)
	const isInXR = useXR((state) => state.mode !== null)

	useEffect(() => {
		setIsInXR(isInXR)
		return () => setIsInXR(false)
	}, [isInXR, setIsInXR])

	return null
}

// XR Provider component - wraps children with XR context, origin, and input handling
const XRManager = ({ children }) => {
	return (
		<XR store={xrStore}>
			<XRSessionTracker />
			<XRInputController />
			<XROriginComponent />
			{children}
		</XR>
	)
}

export default XRManager
