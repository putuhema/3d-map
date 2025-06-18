import { Compass } from "@/components/Compass";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { type Building, buildings as initialBuildings } from "@/data/building";
import { type Corridor, corridors as initialCorridors } from "@/data/corridor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

import { BuildingRenderer } from "@/components/BuildingRenderer";
import { BuildingTools } from "@/components/BuildingTools";
import { GridSystem } from "@/components/GridSystem";
import {
	KeyboardControls,
	OrbitControls,
	PerspectiveCamera,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";

// Keyboard controls map
const keyboardMap = [
	{ name: "forward", keys: ["ArrowUp", "KeyW"] },
	{ name: "backward", keys: ["ArrowDown", "KeyS"] },
	{ name: "leftward", keys: ["ArrowLeft", "KeyA"] },
	{ name: "rightward", keys: ["ArrowRight", "KeyD"] },
];

const cameraPositions = {
	topDown: { position: [0, 15, 6] as [number, number, number] },
	perspective: { position: [-10, 8, 15] as [number, number, number] },
};

// Main component
export default function HospitalMap() {
	const [viewMode, setViewMode] = useState<"topDown" | "perspective" | "walk">(
		"perspective",
	);
	const [cameraMode, setCameraMode] = useState<"free" | "topDown">("free");
	const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0.6, 15));
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [buildings, setBuildings] = useState<Building[]>(
		() => initialBuildings as Building[],
	);
	const [corridors, setCorridors] = useState<Corridor[]>(
		() => initialCorridors as Corridor[],
	);
	const [toolMode, setToolMode] = useState<"place" | "remove" | "corridor">(
		"place",
	);
	const [isDrawingCorridor, setIsDrawingCorridor] = useState(false);
	const [corridorStart, setCorridorStart] = useState<
		[number, number, number] | null
	>(null);
	const [buildingName, setBuildingName] = useState("");
	const [buildingSize, setBuildingSize] = useState<[number, number, number]>([
		1, 1, 1,
	]);
	const [buildingColor, setBuildingColor] = useState("#4f46e5");
	const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
	const [pathCorridorIds, setPathCorridorIds] = useState<string[]>([]);
	const [directions, setDirections] = useState<string[]>([]);
	const [hoveredCellCoords, setHoveredCellCoords] = useState<{
		x: number;
		y: number;
		z: number;
	} | null>(null);
	const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
		null,
	);
	const [showBuildings, setShowBuildings] = useState(true);
	const [editMode, setEditMode] = useState(false);
	useEffect(() => {
		const storedBuildings = localStorage.getItem("buildings");
		const storedCorridors = localStorage.getItem("corridors");
		if (storedBuildings) {
			try {
				setBuildings(JSON.parse(storedBuildings));
			} catch (e) {
				console.warn("Failed to parse stored buildings", e);
			}
		}
		if (storedCorridors) {
			try {
				setCorridors(JSON.parse(storedCorridors));
			} catch (e) {
				console.warn("Failed to parse stored corridors", e);
			}
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("buildings", JSON.stringify(buildings));
	}, [buildings]);

	useEffect(() => {
		localStorage.setItem("corridors", JSON.stringify(corridors));
	}, [corridors]);

	useEffect(() => {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setUserLocation({ lat: latitude, lng: longitude });

					const mapX = (longitude - 106.8451) * 1000; // Adjust based on your map's center longitude
					const mapZ = (latitude - -6.2088) * 1000; // Adjust based on your map's center latitude

					setPlayerPosition(new Vector3(mapX, 0.6, mapZ));
				},
				(error) => {
					setLocationError(
						`Unable to retrieve your location: ${error.message}`,
					);
					console.error("Geolocation error:", error);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0,
				},
			);
		} else {
			setLocationError("Geolocation is not supported by your browser");
		}
	}, []);

	useEffect(() => {
		if (corridors.length === 0 || buildings.length === 0) return;
		const threshold = 1; // max distance to snap
		const endpoints = corridors.flatMap((c) => [c.start, c.end]);
		let changed = false;
		const snappedBuildings = buildings.map((b) => {
			const [bx, by, bz] = b.position;
			let closest: [number, number, number] | null = null;
			let minDist = Number.POSITIVE_INFINITY;
			for (const [ex, , ez] of endpoints) {
				const dist = Math.hypot(bx - ex, bz - ez);
				if (dist < minDist) {
					minDist = dist;
					closest = [ex, by, ez];
				}
			}
			if (
				closest &&
				minDist < threshold &&
				(bx !== closest[0] || bz !== closest[2])
			) {
				changed = true;
				return { ...b, position: closest };
			}
			return b;
		});
		if (changed) setBuildings(snappedBuildings);
	}, [corridors, buildings]);

	const handlePlayerPositionChange = (newPosition: Vector3) => {
		setPlayerPosition(newPosition);
	};

	const handleBuildingPlace = (building: Building) => {
		setBuildings((prev) => [...prev, building]);
	};

	const handleBuildingRemove = (id: string) => {
		setBuildings((prev) => prev.filter((b) => b.id !== id));
	};

	const handleCorridorDraw = (corridor: Corridor) => {
		setCorridors((prev) => [...prev, corridor]);
	};

	const handleCorridorRemove = (id: string) => {
		setCorridors((prev) => prev.filter((c) => c.id !== id));
	};

	const handleGridClick = (x: number, y: number, gridSize = 100) => {
		if (toolMode === "place") {
			const centerX = x - (gridSize / 2 - 0.5);
			const centerZ = y - (gridSize / 2 - 0.5);

			const adjustedX = centerX - (buildingSize[0] - 1) / 2;
			const adjustedZ = centerZ - (buildingSize[2] - 1) / 2;

			handleBuildingPlace({
				id: crypto.randomUUID(),
				name: buildingName || "New Building",
				position: [adjustedX, 0.5, adjustedZ], // Adjusted position
				size: buildingSize,
				color: buildingColor,
			});
		} else if (toolMode === "corridor") {
			if (!isDrawingCorridor) {
				setCorridorStart([
					x - (gridSize / 2 - 0.5),
					0,
					y - (gridSize / 2 - 0.5),
				]);
				setIsDrawingCorridor(true);
			} else if (corridorStart) {
				handleCorridorDraw({
					id: crypto.randomUUID(),
					start: [corridorStart[0], 0, corridorStart[2]],
					end: [x - (gridSize / 2 - 0.5), 0, y - (gridSize / 2 - 0.5)],
					width: 0.5,
				});
				setIsDrawingCorridor(false);
				setCorridorStart(null);
			}
		}
	};

	// Helper: Find building by id
	const getBuildingById = useCallback(
		(id: string) => buildings.find((b) => b.id === id),
		[buildings],
	);

	// Helper: Check if two positions are equal (ignoring y)
	function positionsEqual(
		a: [number, number, number],
		b: [number, number, number],
	) {
		return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[2] - b[2]) < 0.01;
	}

	// Helper: Generate a key for a position using only x and z
	function posKey(pos: [number, number, number]) {
		return `${pos[0]},${pos[2]}`;
	}

	// Pathfinding: BFS over corridors
	function findCorridorPath(
		corridors: Corridor[],
		startPos: [number, number, number],
		endPos: [number, number, number],
	): string[] {
		// Build adjacency list: Map position string -> corridor ids
		const posToCorridors = new Map<
			string,
			{ corridor: Corridor; nextPos: [number, number, number] }[]
		>();
		for (const corridor of corridors) {
			const startKey = posKey(corridor.start);
			const endKey = posKey(corridor.end);
			if (!posToCorridors.has(startKey)) posToCorridors.set(startKey, []);
			if (!posToCorridors.has(endKey)) posToCorridors.set(endKey, []);
			posToCorridors.get(startKey)?.push({ corridor, nextPos: corridor.end });
			posToCorridors.get(endKey)?.push({ corridor, nextPos: corridor.start });
		}
		// BFS
		const queue: { pos: [number, number, number]; path: string[] }[] = [
			{ pos: [startPos[0], 0, startPos[2]], path: [] },
		];
		const visited = new Set<string>();
		while (queue.length > 0) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			const { pos, path } = queue.shift()!;
			const key = posKey(pos);
			if (positionsEqual(pos, [endPos[0], 0, endPos[2]])) return path;
			if (visited.has(key)) continue;
			visited.add(key);
			for (const neighbor of posToCorridors.get(key) || []) {
				const nextPos: [number, number, number] = [
					neighbor.nextPos[0],
					0,
					neighbor.nextPos[2],
				];
				if (!visited.has(posKey(nextPos))) {
					queue.push({
						pos: nextPos,
						path: [...path, neighbor.corridor.id],
					});
				}
			}
		}
		return [];
	}

	return (
		<div
			className="relative h-screen w-full"
			onMouseMove={(e) => {
				if (hoveredCellCoords) {
					setMousePos({ x: e.clientX, y: e.clientY });
				}
			}}
		>
			<div className="absolute top-24 left-4 z-10 flex flex-col gap-2">
				<div className="rounded-md bg-white/90 p-3 shadow-md backdrop-blur-sm">
					{locationError && (
						<div className="mb-2 text-red-600 text-sm">{locationError}</div>
					)}
					{userLocation && (
						<div className="mb-2 text-emerald-600 text-sm">
							Your location: {userLocation.lat.toFixed(6)},{" "}
							{userLocation.lng.toFixed(6)}
						</div>
					)}
					<div className="mb-2 flex items-center gap-2">
						<button
							type="button"
							className={`rounded-md px-3 py-1.5 font-medium text-sm ${
								viewMode === "topDown"
									? "bg-emerald-600 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
							onClick={() => setViewMode("topDown")}
						>
							Top-Down
						</button>
						<button
							type="button"
							className={`rounded-md px-3 py-1.5 font-medium text-sm ${
								viewMode === "perspective"
									? "bg-emerald-600 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
							onClick={() => setViewMode("perspective")}
						>
							3D View
						</button>
						<button
							type="button"
							className={`rounded-md px-3 py-1.5 font-medium text-sm ${
								viewMode === "walk"
									? "bg-emerald-600 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
							onClick={() => setViewMode("walk")}
						>
							Walk Mode
						</button>
						<label className="ml-2 flex items-center gap-1 text-sm">
							<input
								type="checkbox"
								checked={showBuildings}
								onChange={(e) => setShowBuildings(e.target.checked)}
								className="accent-emerald-600"
							/>
							Show Buildings
						</label>
						<label className="ml-2 flex items-center gap-1 text-sm">
							<input
								type="checkbox"
								checked={editMode}
								onChange={(e) => setEditMode(e.target.checked)}
								className="accent-emerald-600"
							/>
							Edit Mode
						</label>
					</div>
					{viewMode === "walk" && (
						<div className="mt-2 text-gray-600 text-xs">
							Use{" "}
							<span className="rounded bg-gray-100 px-1 font-mono">WASD</span>{" "}
							keys to walk around
						</div>
					)}
				</div>
			</div>

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
						onBuildingClick={(id) => {
							console.log(getBuildingById(id));
							if (toolMode === "remove") {
								handleBuildingRemove(id);
								return;
							}
							if (selectedBuildings.length === 0) {
								setSelectedBuildings([id]);
								setPathCorridorIds([]);
								setDirections([]);
							} else if (selectedBuildings.length === 1) {
								if (selectedBuildings[0] === id) return;
								const first = getBuildingById(selectedBuildings[0]);
								const second = getBuildingById(id);
								if (first && second) {
									// Normalize y to 0 for pathfinding
									const path = findCorridorPath(
										corridors,
										[first.position[0], 0, first.position[2]],
										[second.position[0], 0, second.position[2]],
									);
									setPathCorridorIds(path);
									if (path.length === 0) {
										setDirections([
											"No path found between the selected buildings.",
										]);
									} else {
										const steps = path.map((corridorId, idx) => {
											const corridor = corridors.find(
												(c) => c.id === corridorId,
											);
											if (!corridor) return "";
											const from =
												idx === 0
													? [first.position[0], 0, first.position[2]]
													: [
															corridors.find((c) => c.id === path[idx - 1])
																?.end[0] ?? 0,
															0,
															corridors.find((c) => c.id === path[idx - 1])
																?.end[2] ?? 0,
														];
											const to = [corridor.end[0], 0, corridor.end[2]];
											return `Take corridor ${corridorId} from (${from}) to (${to})`;
										});
										setDirections(steps);
									}
								}
								setSelectedBuildings([]);
							} else {
								setSelectedBuildings([id]);
								setPathCorridorIds([]);
								setDirections([]);
							}
						}}
						highlightedCorridorIds={pathCorridorIds}
						highlightedBuildingIds={selectedBuildings}
						showBuildings={showBuildings}
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
				onBuildingPlace={handleBuildingPlace}
				onBuildingRemove={handleBuildingRemove}
				onCorridorDraw={handleCorridorDraw}
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

			{directions.length > 0 && (
				<div className="absolute bottom-6 left-6 z-20 rounded bg-white/90 p-4 shadow">
					<h3 className="mb-2 font-bold">Directions</h3>
					<ol className="ml-4 list-decimal">
						{directions.map((step) => (
							<li key={step}>{step}</li>
						))}
					</ol>
					<button
						className="mt-2 rounded bg-gray-200 px-3 py-1"
						onClick={() => {
							setSelectedBuildings([]);
							setPathCorridorIds([]);
							setDirections([]);
						}}
						type="button"
					>
						Clear Selection
					</button>
				</div>
			)}

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
