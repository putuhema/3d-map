import { BuildingRenderer } from "@/components/BuildingRenderer";
import { Compass } from "@/components/Compass";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { cameraPositions } from "@/utils/constants";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

export default function HospitalMap() {
	const {
		viewMode,
		cameraMode,
		playerPosition,
		buildings,
		corridors,
		rooms,
		showBuildings,
		showRooms,
	} = useHospitalMap();

	return (
		<div className="relative h-screen w-full">
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
						cameraPositions[viewMode === "topDown" ? "topDown" : "perspective"]
							.position,
				}}
			>
				<PerspectiveCamera
					makeDefault
					position={
						cameraPositions[viewMode === "topDown" ? "topDown" : "perspective"]
							.position
					}
				/>
				<OrbitControls
					target={[0, 0, 6]}
					enableRotate={cameraMode === "free"}
					enablePan={true}
					enableZoom={true}
					minDistance={5}
					maxDistance={25}
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
					highlightedCorridorIds={[]}
					highlightedBuildingIds={[]}
					showBuildings={showBuildings}
					showRooms={showRooms}
				/>
			</Canvas>

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
		</div>
	);
}
