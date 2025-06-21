import { AutoZoomCamera } from "@/components/AutoZoomCamera";
import { BuildingRenderer } from "@/components/BuildingRenderer";
import { CameraModeIndicator } from "@/components/CameraModeIndicator";
import { DestinationSelector } from "@/components/DestinationSelector";
import { LocationDialog } from "@/components/RoomDialog";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import MapControl from "@/components/map-control";
import { useCamera } from "@/hooks/useCamera";
import { useDataState } from "@/hooks/useDataState";
import { useLocationInteraction } from "@/hooks/useLocationInteraction";
import { useNavigation } from "@/hooks/useNavigation";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useUIState } from "@/hooks/useUIState";
import { Canvas } from "@react-three/fiber";
import {
	EffectComposer,
	Outline,
	Selection,
} from "@react-three/postprocessing";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

export default function HospitalMap() {
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	// Core data state
	const {
		buildings,
		corridors,
		rooms,
		getBuildingById,
		getRoomById,
		getPositionById,
	} = useDataState();

	// Player state
	const { playerPosition } = usePlayerState();

	// UI state
	const {
		showBuildings,
		showRooms,
		selectedBuildings,
		pathCorridorIds,
		roomDialogOpen,
		setRoomDialogOpen,
		selectedLocation,
		setSelectedLocation,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		resetUI,
		clearPath,
	} = useUIState();

	// Navigation state
	const {
		fromId,
		toId,
		handleFromSelect,
		handleToSelect: navigationHandleToSelect,
		handleUseCurrentLocation,
		findPath,
		resetNavigation,
	} = useNavigation({
		corridors,
		rooms,
		playerPosition: { x: playerPosition.x, z: playerPosition.z },
		getPositionById,
		getRoomById,
		getBuildingById,
	});

	// Camera state
	const { cameraTarget } = useCamera({
		fromId,
		toId,
		playerPosition: { x: playerPosition.x, z: playerPosition.z },
		getRoomById,
		getBuildingById,
	});

	// Location interaction
	const {
		handleToSelect: locationHandleToSelect,
		handleLocationClick,
		handleRoomDialogClose,
	} = useLocationInteraction({
		getRoomById,
		getBuildingById,
		setSelectedLocation,
		setLocationDialogOpen: setRoomDialogOpen,
		setSelectedBuildingId: () => {}, // Not needed for this component
		setSelectedRoomId: () => {}, // Not needed for this component
		setDestinationSelectorExpanded,
		clearPath,
	});

	// Combined handleToSelect
	const handleToSelect = useCallback(
		(id: string, type: "building" | "room" | "corridor") => {
			navigationHandleToSelect(id, type);
			locationHandleToSelect(id, type);
		},
		[navigationHandleToSelect, locationHandleToSelect],
	);

	// Pathfinding handler
	const handleFindPath = useCallback(() => {
		const { path, directions: pathDirections } = findPath();
		// Update path state through navigation store
		// This will be handled by the navigation hook
	}, [findPath]);

	// Reset function
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

	const handleCorridorClick = useCallback(
		(id: string) => {
			// When a corridor is clicked, set it as the starting point
			handleFromSelect(id, "corridor");
		},
		[handleFromSelect],
	);

	return (
		<div className="relative h-screen w-full">
			<TutorialOverlay />
			<CameraModeIndicator />

			<DestinationSelector
				buildings={buildings}
				rooms={rooms}
				onFromSelect={handleFromSelect}
				onToSelect={handleToSelect}
				onFindPath={handleFindPath}
				onUseCurrentLocation={handleUseCurrentLocation}
				fromId={fromId}
				toId={toId}
				playerPosition={playerPosition}
				isExpanded={destinationSelectorExpanded}
				onExpandedChange={setDestinationSelectorExpanded}
			/>

			<LocationDialog
				location={selectedLocation}
				open={roomDialogOpen}
				onOpenChange={setRoomDialogOpen}
				onClose={handleRoomDialogClose}
				buildings={buildings}
				rooms={rooms}
			/>

			<Canvas {...canvasConfig}>
				<AutoZoomCamera
					cameraTarget={cameraTarget}
					fromId={fromId}
					toId={toId}
					rooms={rooms}
					playerPosition={playerPosition}
				/>

				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
					castShadow={!isMobileDevice}
					shadow-mapSize-width={isMobileDevice ? 1024 : 2048}
					shadow-mapSize-height={isMobileDevice ? 1024 : 2048}
				/>
				<directionalLight position={[-5, 8, -10]} intensity={0.3} />

				<Selection>
					<EffectComposer multisampling={0} autoClear={false}>
						<Outline blur visibleEdgeColor={0xffffff} edgeStrength={50} />
					</EffectComposer>
					<BuildingRenderer
						buildings={buildings}
						corridors={corridors}
						rooms={rooms}
						onBuildingClick={handleLocationClick}
						onCorridorClick={handleCorridorClick}
						highlightedCorridorIds={pathCorridorIds}
						highlightedBuildingIds={selectedBuildings}
						showBuildings={showBuildings}
						showRooms={showRooms}
						fromId={fromId}
						toId={toId}
					/>
				</Selection>
			</Canvas>

			<MapControl onReset={handleReset} />
		</div>
	);
}
