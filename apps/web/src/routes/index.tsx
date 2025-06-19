import { AutoZoomCamera } from "@/components/AutoZoomCamera";
import { BuildingRenderer } from "@/components/BuildingRenderer";
import { DestinationSelector } from "@/components/DestinationSelector";
import { RoomDialog } from "@/components/RoomDialog";
import MapControl from "@/components/map-control";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

	const {
		playerPosition,
		buildings,
		corridors,
		rooms,
		showBuildings,
		showRooms,
		fromId,
		toId,
		handleFromSelect,
		handleToSelect,
		handleFindPath,
		handleUseCurrentLocation,
		selectedBuildings,
		pathCorridorIds,
		roomDialogOpen,
		setRoomDialogOpen,
		selectedRoom,
		handleRoomDialogClose,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		cameraTarget,
	} = useHospitalMap();

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Mobile-optimized Canvas configuration
	const canvasConfig = {
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
	};

	return (
		<div className="relative h-screen w-full">
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

			<RoomDialog
				room={selectedRoom}
				open={roomDialogOpen}
				onOpenChange={setRoomDialogOpen}
				onClose={handleRoomDialogClose}
			/>

			<div className="h-full w-full">
				<Canvas {...canvasConfig}>
					<AutoZoomCamera
						cameraTarget={cameraTarget}
						fromId={fromId}
						toId={toId}
						rooms={rooms}
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

					<BuildingRenderer
						buildings={buildings}
						corridors={corridors}
						rooms={rooms}
						onBuildingClick={() => {}}
						onCorridorClick={() => {}}
						highlightedCorridorIds={pathCorridorIds}
						highlightedBuildingIds={selectedBuildings}
						showBuildings={showBuildings}
						showRooms={showRooms}
					/>
				</Canvas>
			</div>
			<MapControl />
		</div>
	);
}
