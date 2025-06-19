import { BuildingRenderer } from "@/components/BuildingRenderer";
import { BuildingTools } from "@/components/BuildingTools";
import { Compass } from "@/components/Compass";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { DestinationSelector } from "@/components/DestinationSelector";
import { GridSystem } from "@/components/GridSystem";
import { DirectionsDisplay } from "@/components/hospital-map/DirectionsDisplay";
import { ViewControls } from "@/components/hospital-map/ViewControls";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { cameraPositions, keyboardMap } from "@/utils/constants";
import {
	KeyboardControls,
	OrbitControls,
	PerspectiveCamera,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

export default function HospitalMap() {
	const {
		viewMode,
		setViewMode,
		cameraMode,
		playerPosition,
		userLocation,
		locationError,
		buildings,
		corridors,
		rooms,
		toolMode,
		setToolMode,
		buildingName,
		setBuildingName,
		buildingSize,
		setBuildingSize,
		buildingColor,
		setBuildingColor,
		selectedBuildings,
		pathCorridorIds,
		directions,
		hoveredCellCoords,
		setHoveredCellCoords,
		mousePos,
		setMousePos,
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,
		editMode,
		setEditMode,
		handleGridClick,
		handleBuildingClick,
		handleCorridorRemove,
		setSelectedBuildings,
		setPathCorridorIds,
		setDirections,
		fromId,
		toId,
		handleFromSelect,
		handleToSelect,
		handleFindPath,
		setFromId,
		setToId,
		handleUseCurrentLocation,
	} = useHospitalMap();

	return (
		<div
			className="relative h-screen w-full"
			onMouseMove={(e) => {
				if (hoveredCellCoords) {
					setMousePos({ x: e.clientX, y: e.clientY });
				}
			}}
		>
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

			<ViewControls
				viewMode={viewMode}
				setViewMode={setViewMode}
				showBuildings={showBuildings}
				showRooms={showRooms}
				setShowRooms={setShowRooms}
				setShowBuildings={setShowBuildings}
				editMode={editMode}
				setEditMode={setEditMode}
				locationError={locationError}
				userLocation={userLocation}
			/>

			<KeyboardControls map={keyboardMap}>
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
							viewMode === "walk"
								? [playerPosition.x, playerPosition.y + 2, playerPosition.z + 3]
								: cameraPositions[
										viewMode === "topDown" ? "topDown" : "perspective"
									].position,
					}}
				>
					<PerspectiveCamera
						makeDefault
						position={
							viewMode === "walk"
								? [playerPosition.x, playerPosition.y + 2, playerPosition.z + 3]
								: cameraPositions[
										viewMode === "topDown" ? "topDown" : "perspective"
									].position
						}
					/>
					{viewMode !== "walk" && (
						<OrbitControls
							target={[0, 0, 6]}
							enableRotate={cameraMode === "free"}
							enablePan={true}
							enableZoom={true}
							minDistance={5}
							maxDistance={25}
							maxPolarAngle={cameraMode === "topDown" ? 0 : Math.PI / 2 - 0.1}
						/>
					)}

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
						onBuildingClick={handleBuildingClick}
						onCorridorClick={handleCorridorRemove}
						highlightedCorridorIds={pathCorridorIds}
						highlightedBuildingIds={selectedBuildings}
						showBuildings={showBuildings}
						showRooms={showRooms}
					/>

					<GridSystem
						gridSize={100}
						cellSize={1}
						onCellClick={(x: number, y: number) => {
							if (editMode) {
								handleGridClick(x, y, 100);
							}
						}}
						onCellHover={(coords) => setHoveredCellCoords(coords)}
					/>
				</Canvas>
			</KeyboardControls>

			<BuildingTools
				selectedMode={toolMode}
				onModeChange={setToolMode}
				buildingName={buildingName}
				onBuildingNameChange={setBuildingName}
				buildingSize={buildingSize}
				onBuildingSizeChange={setBuildingSize}
				buildingColor={buildingColor}
				onBuildingColorChange={setBuildingColor}
				buildings={buildings}
				corridors={corridors}
				onCorridorRemove={handleCorridorRemove}
			/>

			<div className="absolute top-6 right-6 z-20">
				<Compass direction={0} />
			</div>
			<div className="absolute right-6 bottom-6 z-20">
				<CoordinateDisplay
					x={playerPosition.x}
					y={playerPosition.y}
					z={playerPosition.z}
				/>
			</div>

			<DirectionsDisplay
				directions={directions}
				onClear={() => {
					setSelectedBuildings([]);
					setPathCorridorIds([]);
					setDirections([]);
					setFromId(null);
					setToId(null);
				}}
			/>

			{hoveredCellCoords && mousePos && (
				<div
					className="pointer-events-none fixed z-50"
					style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
				>
					<CoordinateDisplay
						x={hoveredCellCoords.x}
						y={hoveredCellCoords.y}
						z={hoveredCellCoords.z}
					/>
				</div>
			)}
		</div>
	);
}
