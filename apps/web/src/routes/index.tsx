import { BuildingRenderer } from "@/components/BuildingRenderer";
import { DestinationSelector } from "@/components/DestinationSelector";
import MapControl from "@/components/map-control";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { useViewStore } from "@/lib/store";
import { cameraPositions } from "@/utils/constants";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

export default function HospitalMap() {
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
	} = useHospitalMap();

	const { viewMode, cameraMode } = useViewStore();

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
			/>
			<div className="h-full w-full">
				<Canvas
					shadows
					dpr={[1, 2]}
					gl={{
						antialias: true,
						powerPreference: "high-performance",
						stencil: false,
						depth: true,
					}}
					camera={{
						fov: 45,
						near: 0.1,
						far: 1000,
						position:
							cameraPositions[
								viewMode === "topDown" ? "topDown" : "perspective"
							].position,
					}}
				>
					<PerspectiveCamera
						makeDefault
						position={
							cameraPositions[
								viewMode === "topDown" ? "topDown" : "perspective"
							].position
						}
					/>
					<OrbitControls
						target={[0, 0, 6]}
						enableRotate={cameraMode === "free"}
						enablePan={true}
						enableZoom={true}
						minDistance={5}
						maxDistance={50}
						maxPolarAngle={cameraMode === "topDown" ? 0 : Math.PI / 2 - 0.1}
					/>

					<ambientLight intensity={0.5} />
					<directionalLight
						position={[10, 10, 5]}
						intensity={1}
						castShadow
						shadow-mapSize-width={2048}
						shadow-mapSize-height={2048}
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
