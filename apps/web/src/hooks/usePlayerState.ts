import { useCallback, useState } from "react";
import { Vector3 } from "three";

export function usePlayerState() {
	const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0.6, 15));
	const [locationError, setLocationError] = useState<string | null>(null);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const updatePlayerPosition = useCallback((position: Vector3) => {
		setPlayerPosition(position);
	}, []);

	const updateUserLocation = useCallback((lat: number, lng: number) => {
		setUserLocation({ lat, lng });
		setLocationError(null);
	}, []);

	const updateLocationError = useCallback((error: string | null) => {
		setLocationError(error);
	}, []);

	return {
		playerPosition,
		updatePlayerPosition,
		locationError,
		setLocationError,
		updateLocationError,
		userLocation,
		updateUserLocation,
	};
}
