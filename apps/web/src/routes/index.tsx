import { AutoZoomCamera } from "@/components/AutoZoomCamera";
import { CameraModeIndicator } from "@/components/CameraModeIndicator";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { BuildingRenderer } from "@/components/building-renderer";
import { DestinationSelector } from "@/components/destination-selector";
import { LocationDialog } from "@/components/location-dialog";
import MapControl from "@/components/map-control";
import { useHospitalMap } from "@/hooks/useHospitalMap";

import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

export default function HospitalMap() {
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	const {
		buildings,
		corridors,
		rooms,
		showBuildings,
		showRooms,
		selectedBuildings,
		pathCorridorIds,
		resetUI,
		resetNavigation,
		handleFindPath,
		cameraTarget,
		handleLocationClick,
	} = useHospitalMap();

	const [isPathfinding, setIsPathfinding] = useState(false);

	const handleFindPathWithLoading = useCallback(() => {
		if (isPathfinding) return; // Prevent multiple simultaneous operations

		setIsPathfinding(true);
		try {
			handleFindPath();
		} catch (error) {
			console.error("Pathfinding error:", error);
		} finally {
			setIsPathfinding(false);
		}
	}, [handleFindPath, isPathfinding]);

	const handleReset = useCallback(() => {
		resetUI();
		resetNavigation();
	}, [resetUI, resetNavigation]);

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Mobile-optimized Canvas configuration
	const canvasConfig = useMemo(
		() => ({
			shadows: !isMobileDevice, // Disable shadows on mobile for better performance
			dpr: isMobileDevice
				? ([1, 1.5] as [number, number])
				: ([1, 2] as [number, number]), // Lower DPR on mobile
			gl: {
				antialias: !isMobileDevice, // Disable antialiasing on mobile for performance
				powerPreference: "high-performance" as const,
				stencil: false,
				depth: true,
			},
			camera: {
				fov: isMobileDevice ? 50 : 45, // Slightly wider FOV on mobile
				near: 0.1,
				far: 1000,
			},
		}),
		[isMobileDevice],
	);

	return (
		<div className="relative h-screen w-full">
			<TutorialOverlay />
			<CameraModeIndicator />

			<DestinationSelector
				buildings={buildings}
				rooms={rooms}
				onFindPath={handleFindPathWithLoading}
				isPathfinding={isPathfinding}
			/>

			<LocationDialog onFindPath={handleFindPathWithLoading} />

			<Canvas {...canvasConfig}>
				<AutoZoomCamera cameraTarget={cameraTarget} rooms={rooms} />

				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
					castShadow={!isMobileDevice}
					shadow-mapSize-width={isMobileDevice ? 1024 : 2048}
					shadow-mapSize-height={isMobileDevice ? 1024 : 2048}
				/>
				<directionalLight position={[-5, 8, -10]} intensity={0.3} />

				<BuildingRenderer
					buildings={buildings}
					corridors={corridors}
					rooms={rooms}
					onBuildingClick={handleLocationClick}
					highlightedCorridorIds={pathCorridorIds}
					highlightedBuildingIds={selectedBuildings}
					showBuildings={showBuildings}
					showRooms={showRooms}
				/>
			</Canvas>

			<MapControl onReset={handleReset} />
		</div>
	);
}
