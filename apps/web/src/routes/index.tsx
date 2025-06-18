import { Compass } from "@/components/Compass";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

import { BuildingRenderer } from "@/components/BuildingRenderer";
import {
	type Building,
	BuildingTools,
	type Corridor,
} from "@/components/BuildingTools";
import { GridSystem } from "@/components/GridSystem";
import { rooms } from "@/data/room";
import {
	Html,
	KeyboardControls,
	Line,
	OrbitControls,
	OrthographicCamera,
	PerspectiveCamera,
	Text,
	useKeyboardControls,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Color, type Mesh, type MeshStandardMaterial, Vector3 } from "three";

// Keyboard controls map
const keyboardMap = [
	{ name: "forward", keys: ["ArrowUp", "KeyW"] },
	{ name: "backward", keys: ["ArrowDown", "KeyS"] },
	{ name: "leftward", keys: ["ArrowLeft", "KeyA"] },
	{ name: "rightward", keys: ["ArrowRight", "KeyD"] },
];

// Player component
function Player({
	position,
	onPositionChange,
	walkMode,
}: {
	position: Vector3;
	onPositionChange: (pos: Vector3) => void;
	walkMode: boolean;
}) {
	const playerRef = useRef<Mesh>(null);
	const { camera } = useThree();
	const [, get] = useKeyboardControls();

	useFrame((state, delta) => {
		if (!walkMode || !playerRef.current) return;

		try {
			const controls = get();
			if (!controls) return;

			const { forward, backward, leftward, rightward } = controls;
			const velocity = new Vector3();
			const speed = 3;

			if (forward) velocity.z -= speed * delta;
			if (backward) velocity.z += speed * delta;
			if (leftward) velocity.x -= speed * delta;
			if (rightward) velocity.x += speed * delta;

			// Apply movement with collision detection
			const currentPos = playerRef.current.position;
			const newPosition = currentPos.clone().add(velocity);

			// Simple collision detection - keep player in corridors
			const isInCorridor = checkIfInCorridor(newPosition.x, newPosition.z);
			if (isInCorridor) {
				playerRef.current.position.copy(newPosition);
				onPositionChange(newPosition.clone());

				// Update camera to follow player (third-person view)
				if (camera) {
					camera.position.set(
						newPosition.x,
						newPosition.y + 2,
						newPosition.z + 3,
					);
					camera.lookAt(newPosition.x, newPosition.y + 1, newPosition.z);
				}
			}
		} catch (error) {
			console.warn("Player movement error:", error);
		}
	});

	// Simple corridor detection
	function checkIfInCorridor(x: number, z: number) {
		// Main horizontal corridors
		if (
			(Math.abs(z - 0) < 0.6 && Math.abs(x) < 6) ||
			(Math.abs(z - 3) < 0.6 && Math.abs(x) < 6) ||
			(Math.abs(z - 6) < 0.6 && Math.abs(x) < 6) ||
			(Math.abs(z - 9) < 0.6 && Math.abs(x) < 6) ||
			(Math.abs(z - 12) < 0.6 && Math.abs(x) < 4)
		) {
			return true;
		}

		// Main vertical corridors
		if (
			(Math.abs(x + 4.5) < 0.6 && z >= -1 && z <= 10) ||
			(Math.abs(x + 1.5) < 0.6 && z >= -1 && z <= 10) ||
			(Math.abs(x - 1.5) < 0.6 && z >= -1 && z <= 10) ||
			(Math.abs(x) < 0.6 && z >= 7 && z <= 14)
		) {
			return true;
		}

		// Entrance area
		if (Math.abs(x) < 1.5 && z >= 13 && z <= 16) {
			return true;
		}

		return false;
	}

	if (!walkMode) return null;

	return (
		<mesh
			ref={playerRef}
			position={[position.x, position.y, position.z]}
			castShadow
		>
			<capsuleGeometry args={[0.05, 0.1]} />
			<meshStandardMaterial color="#4f46e5" />
		</mesh>
	);
}

// Room component with 3D height
function Room({
	name,
	position,
	size,
	color,
	isHovered,
	onHover,
	onLeave,
}: {
	name: string;
	position: number[];
	size: number[];
	color: string;
	isHovered: boolean;
	onHover: (name: string) => void;
	onLeave: () => void;
}) {
	const mesh = useRef<Mesh>(null);
	// Make rooms taller for 3D effect - adjust height based on room type
	const height =
		name === "OK" ? 0.8 : name === "ICU" || name === "Radiologi" ? 0.6 : 0.4;
	const actualSize = [size[0], height, size[2]];

	useFrame(() => {
		if (mesh.current) {
			try {
				const material = mesh.current.material as MeshStandardMaterial;
				if (material) {
					if (isHovered) {
						material.color.set(new Color("#fbbf24"));
						material.emissive.set(new Color("#f59e0b"));
						material.emissiveIntensity = 0.2;
					} else {
						material.color.set(new Color(color));
						material.emissive.set(new Color("#000000"));
						material.emissiveIntensity = 0;
					}
				}
			} catch (error) {
				console.warn("Room material error:", error);
			}
		}
	});

	return (
		<group position={[position[0], position[1] + height / 2, position[2]]}>
			<mesh
				ref={mesh}
				onPointerOver={(e) => {
					e.stopPropagation();
					onHover(name);
				}}
				onPointerOut={() => onLeave()}
				castShadow
				receiveShadow
			>
				<boxGeometry args={actualSize as [number, number, number]} />
				<meshStandardMaterial color={color} />
			</mesh>
			<Text
				position={[0, height / 2 + 0.1, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
				fontSize={0.15}
				color="black"
				anchorX="center"
				anchorY="middle"
				maxWidth={size[0] * 2}
				textAlign="center"
			>
				{name}
			</Text>
		</group>
	);
}

function InfoPanel({
	hoveredRoom,
	walkMode,
}: { hoveredRoom: string | null; walkMode: boolean }) {
	if (!hoveredRoom) return null;

	return (
		<Html
			position={[0, 0, 0]}
			transform={false}
			style={{
				position: "fixed",
				top: walkMode ? "20px" : "120px",
				right: "20px",
				zIndex: 1000,
			}}
		>
			<div className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
				<h3 className="mb-2 font-bold text-emerald-700 text-lg">
					{hoveredRoom}
				</h3>
				<p className="text-gray-600 text-sm">{getDescription(hoveredRoom)}</p>
			</div>
		</Html>
	);
}

// Helper function to get room descriptions
function getDescription(roomName: string) {
	const descriptions: Record<string, string> = {
		"Kelas I": "First class patient ward with premium facilities",
		"Kelas II": "Second class patient ward",
		"R. Anak": "Pediatric department for children's healthcare",
		Interna: "Internal medicine department",
		Perksa: "Examination room",
		"G. Bersalin": "Maternity ward",
		"ISO-TB": "Tuberculosis isolation ward",
		ICU: "Intensive Care Unit for critical patients",
		K_umroh: "Umrah preparation services",
		OK: "Operating room for surgical procedures",
		Lab: "Laboratory for medical tests and analysis",
		Apotek: "Pharmacy for medication dispensing",
		Radiologi: "Radiology department for imaging services",
		Farmasi: "Pharmacy storage and preparation area",
		Entrance: "Main hospital entrance",
		Laundry: "Hospital laundry services",
		"Tranfus Darah": "Blood transfusion services",
		WC: "Restroom facilities",
		RM: "Medical Records department",
		Server: "IT server room",
	};

	return descriptions[roomName] || "Hospital department";
}

// Camera positions
const cameraPositions = {
	topDown: { position: [0, 15, 6] as [number, number, number] },
	perspective: { position: [-10, 8, 15] as [number, number, number] },
};

// Navigation path finding
function findPath(start: Vector3, end: Vector3): Vector3[] {
	// Convert room positions to grid coordinates
	const gridSize = 1.5; // Size of each grid cell
	const startGrid = {
		x: Math.round(start.x / gridSize),
		z: Math.round(start.z / gridSize),
	};
	const endGrid = {
		x: Math.round(end.x / gridSize),
		z: Math.round(end.z / gridSize),
	};

	// A* pathfinding implementation
	const openSet = new Set<string>();
	const closedSet = new Set<string>();
	const cameFrom = new Map<string, string>();
	const gScore = new Map<string, number>();
	const fScore = new Map<string, number>();

	const startKey = `${startGrid.x},${startGrid.z}`;
	const endKey = `${endGrid.x},${endGrid.z}`;

	openSet.add(startKey);
	gScore.set(startKey, 0);
	fScore.set(startKey, heuristic(startGrid, endGrid));

	while (openSet.size > 0) {
		let current = "";
		let lowestFScore = Number.POSITIVE_INFINITY;

		for (const key of openSet) {
			const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
			if (score < lowestFScore) {
				lowestFScore = score;
				current = key;
			}
		}

		if (current === endKey) {
			return reconstructPath(cameFrom, current, gridSize);
		}

		openSet.delete(current);
		closedSet.add(current);

		const [x, z] = current.split(",").map(Number);
		const neighbors = getNeighbors(x, z);

		for (const neighbor of neighbors) {
			const neighborKey = `${neighbor.x},${neighbor.z}`;
			if (closedSet.has(neighborKey)) continue;

			const tentativeGScore =
				(gScore.get(current) ?? Number.POSITIVE_INFINITY) + 1;

			if (!openSet.has(neighborKey)) {
				openSet.add(neighborKey);
			} else if (
				tentativeGScore >= (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)
			) {
				continue;
			}

			cameFrom.set(neighborKey, current);
			gScore.set(neighborKey, tentativeGScore);
			fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, endGrid));
		}
	}

	return []; // No path found
}

function heuristic(
	a: { x: number; z: number },
	b: { x: number; z: number },
): number {
	return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

function getNeighbors(x: number, z: number): { x: number; z: number }[] {
	return [
		{ x: x + 1, z },
		{ x: x - 1, z },
		{ x, z: z + 1 },
		{ x, z: z - 1 },
	].filter(({ x, z }) => isWalkable(x, z));
}

function isWalkable(x: number, z: number): boolean {
	// Check if the position is in a corridor
	const posX = x * 1.5;
	const posZ = z * 1.5;

	// Main horizontal corridors
	if (
		(Math.abs(posZ - 0) < 0.6 && Math.abs(posX) < 6) ||
		(Math.abs(posZ - 3) < 0.6 && Math.abs(posX) < 6) ||
		(Math.abs(posZ - 6) < 0.6 && Math.abs(posX) < 6) ||
		(Math.abs(posZ - 9) < 0.6 && Math.abs(posX) < 6) ||
		(Math.abs(posZ - 12) < 0.6 && Math.abs(posX) < 4)
	) {
		return true;
	}

	// Main vertical corridors
	if (
		(Math.abs(posX + 4.5) < 0.6 && posZ >= -1 && posZ <= 10) ||
		(Math.abs(posX + 1.5) < 0.6 && posZ >= -1 && posZ <= 10) ||
		(Math.abs(posX - 1.5) < 0.6 && posZ >= -1 && posZ <= 10) ||
		(Math.abs(posX) < 0.6 && posZ >= 7 && posZ <= 14)
	) {
		return true;
	}

	// Entrance area
	if (Math.abs(posX) < 1.5 && posZ >= 13 && posZ <= 16) {
		return true;
	}

	return false;
}

function reconstructPath(
	cameFrom: Map<string, string>,
	current: string,
	gridSize: number,
): Vector3[] {
	const path: Vector3[] = [];
	let currentKey = current;

	while (cameFrom.has(currentKey)) {
		const [x, z] = currentKey.split(",").map(Number);
		path.unshift(new Vector3(x * gridSize, 0.1, z * gridSize));
		const nextKey = cameFrom.get(currentKey);
		if (!nextKey) break;
		currentKey = nextKey;
	}

	const [x, z] = currentKey.split(",").map(Number);
	path.unshift(new Vector3(x * gridSize, 0.1, z * gridSize));

	return path;
}

// Navigation path component
function NavigationPath({ path }: { path: Vector3[] }) {
	if (path.length === 0) return null;

	return (
		<Line points={path} color="#4f46e5" lineWidth={3} opacity={0.8} transparent>
			<lineBasicMaterial color="#4f46e5" linewidth={3} />
		</Line>
	);
}

// Navigation directions component
function NavigationDirections({
	path,
	currentPosition,
}: {
	path: Vector3[];
	currentPosition: Vector3;
}) {
	if (path.length === 0) return null;

	const getDirection = (current: Vector3, next: Vector3): string => {
		const dx = next.x - current.x;
		const dz = next.z - current.z;

		if (Math.abs(dx) > Math.abs(dz)) {
			return dx > 0 ? "Turn right" : "Turn left";
		}
		return dz > 0 ? "Go straight" : "Turn around";
	};

	const currentIndex = path.findIndex(
		(point) =>
			Math.abs(point.x - currentPosition.x) < 0.5 &&
			Math.abs(point.z - currentPosition.z) < 0.5,
	);

	if (currentIndex === -1 || currentIndex === path.length - 1) return null;

	const nextPoint = path[currentIndex + 1];
	const direction = getDirection(currentPosition, nextPoint);
	const distance = Math.round(currentPosition.distanceTo(nextPoint) * 10);

	return (
		<Html
			position={[0, 0, 0]}
			transform={false}
			style={{
				position: "fixed",
				bottom: "20px",
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 1000,
			}}
		>
			<div className="rounded-lg border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
				<div className="font-semibold text-emerald-700 text-lg">
					{direction}
				</div>
				<div className="text-gray-600 text-sm">
					{distance} meters to next turn
				</div>
			</div>
		</Html>
	);
}

// Navigation UI component
function NavigationUI({
	onSelectDestination,
	selectedRoom,
}: {
	onSelectDestination: (room: string) => void;
	selectedRoom: string | null;
}) {
	return (
		<Html
			position={[0, 0, 0]}
			transform={false}
			style={{
				position: "fixed",
				top: "20px",
				left: "20px",
				zIndex: 1000,
			}}
		>
			<div className="w-64 rounded-lg border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
				<h3 className="mb-2 font-semibold text-emerald-700 text-lg">
					Navigation
				</h3>
				<div className="space-y-2">
					<select
						className="w-full rounded-md border p-2"
						onChange={(e) => onSelectDestination(e.target.value)}
						value={selectedRoom || ""}
					>
						<option value="">Select destination...</option>
						{rooms.map((room) => (
							<option key={room.name} value={room.name}>
								{room.name}
							</option>
						))}
					</select>
				</div>
			</div>
		</Html>
	);
}

// Main component
export default function HospitalMap() {
	const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"topDown" | "perspective" | "walk">(
		"perspective",
	);
	const [cameraMode, setCameraMode] = useState<"free" | "topDown">("free");
	const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0.6, 15));
	const [selectedDestination, setSelectedDestination] = useState<string | null>(
		null,
	);
	const [navigationPath, setNavigationPath] = useState<Vector3[]>([]);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	console.log(userLocation);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [buildings, setBuildings] = useState<Building[]>([]);
	const [corridors, setCorridors] = useState<Corridor[]>([]);
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

	// Save buildings to localStorage whenever they change
	useEffect(() => {
		localStorage.setItem("buildings", JSON.stringify(buildings));
	}, [buildings]);

	// Save corridors to localStorage whenever they change
	useEffect(() => {
		localStorage.setItem("corridors", JSON.stringify(corridors));
	}, [corridors]);

	// Add geolocation detection
	useEffect(() => {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					console.log(latitude, longitude);
					setUserLocation({ lat: latitude, lng: longitude });

					// Convert GPS coordinates to map coordinates
					// This is a simple conversion - you might want to adjust these values
					// based on your actual map's coordinate system
					const mapX = (longitude - 106.8451) * 1000; // Adjust based on your map's center longitude
					const mapZ = (latitude - -6.2088) * 1000; // Adjust based on your map's center latitude

					// Set player position to user's location
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

	const handlePlayerPositionChange = (newPosition: Vector3) => {
		setPlayerPosition(newPosition);
	};

	const handleSelectDestination = (roomName: string) => {
		setSelectedDestination(roomName);
		const destinationRoom = rooms.find((room) => room.name === roomName);
		if (destinationRoom) {
			const destination = new Vector3(
				destinationRoom.position[0],
				0,
				destinationRoom.position[2],
			);
			const path = findPath(playerPosition, destination);
			setNavigationPath(path);
		}
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

	const handleGridClick = (x: number, y: number) => {
		if (toolMode === "place") {
			const centerX = x - 24.5;
			const centerZ = y - 24.5;

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
				setCorridorStart([x - 24.5, 0, y - 24.5]); // y is always 0
				setIsDrawingCorridor(true);
			} else if (corridorStart) {
				handleCorridorDraw({
					id: crypto.randomUUID(),
					start: [corridorStart[0], 0, corridorStart[2]], // force y=0
					end: [x - 24.5, 0, y - 24.5], // force y=0
					width: 0.9,
				});
				setIsDrawingCorridor(false);
				setCorridorStart(null);
			}
		}
	};

	return (
		<div className="h-screen w-full">
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

					{/* Floor */}
					{/* <mesh
						rotation={[-Math.PI / 2, 0, 0]}
						position={[0, 0, 6]}
						receiveShadow
					>
						<planeGeometry args={[20, 25]} />
						<meshStandardMaterial color="#f5f5f5" />
					</mesh> */}

					{/* Player */}
					<Player
						position={playerPosition}
						onPositionChange={handlePlayerPositionChange}
						walkMode={viewMode === "walk"}
					/>

					{/* Rooms */}
					{/* {rooms.map((room) => (
						<Room
							key={room.name}
							{...room}
							isHovered={hoveredRoom === room.name}
							onHover={(name: string) => setHoveredRoom(name)}
							onLeave={() => setHoveredRoom(null)}
						/>
					))} */}

					{/* Navigation */}
					{/* <NavigationPath path={navigationPath} />
					{viewMode === "walk" && (
						<NavigationDirections
							path={navigationPath}
							currentPosition={playerPosition}
						/>
					)}
					<NavigationUI
						onSelectDestination={handleSelectDestination}
						selectedRoom={selectedDestination}
					/> */}

					{/* Info panel */}
					{/* <InfoPanel hoveredRoom={hoveredRoom} walkMode={viewMode === "walk"} /> */}

					{/* Add BuildingRenderer */}
					<BuildingRenderer
						buildings={buildings}
						corridors={corridors}
						onBuildingClick={(id) => {
							if (toolMode === "remove") {
								handleBuildingRemove(id);
							}
						}}
					/>

					<GridSystem
						gridSize={50}
						cellSize={1}
						onCellClick={(x: number, y: number) => {
							handleGridClick(x, y);
						}}
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

			{/* Compass overlay */}
			<div className="absolute top-6 right-6 z-20">
				<Compass direction={0} />
			</div>
			{/* Coordinate display overlay */}
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
