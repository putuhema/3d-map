import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { useLabelStore } from "@/lib/store";
import {
	BUILDING_MODELS,
	getBuildingModelPath,
	getUniqueModelPaths,
} from "@/utils/buildingModels";
import { Html, Line, Sky, useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Material, Mesh, MeshStandardMaterial, Vector3 } from "three";

// Preload all available GLB models
useGLTF.preload(BUILDING_MODELS.DEFAULT);
useGLTF.preload(BUILDING_MODELS.ROTATED_90);

interface BuildingRendererProps {
	buildings: Building[];
	corridors: Corridor[];
	rooms: Room[];
	onBuildingClick?: (id: string, roomId?: string) => void;
	onCorridorClick?: (id: string) => void;
	highlightedCorridorIds?: string[];
	highlightedBuildingIds?: string[];
	showBuildings?: boolean;
	showRooms?: boolean;
	fromId?: string | null;
	toId?: string | null;
	selectedBuildingId?: string | null;
	selectedRoomId?: string | null;
}

// Custom building model component
function BuildingModel({
	building,
	position,
	scale,
	onClick,
	onPointerOver,
	onPointerOut,
	color,
	opacity = 1,
	hasRooms = false,
	isHighlighted = false,
	isSelected = false,
	isHovered = false,
	rotation,
}: {
	building: Building;
	position: Vector3;
	scale: Vector3;
	onClick?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOver?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOut?: (e: ThreeEvent<MouseEvent>) => void;
	color?: string;
	opacity?: number;
	hasRooms?: boolean;
	isHighlighted?: boolean;
	isSelected?: boolean;
	isHovered?: boolean;
	rotation?: [number, number, number];
}) {
	// Use the building's custom model path or default to the standard building model
	const modelPath = getBuildingModelPath(building);
	const { scene } = useGLTF(modelPath);
	const buildingRef = useRef<Mesh>(null);
	const clonedMaterialsRef = useRef<Material[]>([]);

	const clonedScene = useMemo(() => {
		if (!scene) return null;
		return scene.clone();
	}, [scene]);

	// Apply material overrides only when necessary
	useEffect(() => {
		if (!clonedScene) return;

		// Clean up previous cloned materials
		for (const mat of clonedMaterialsRef.current) {
			if (mat.dispose) {
				mat.dispose();
			}
		}
		clonedMaterialsRef.current = [];

		// Only apply overrides if we have a specific color or opacity change
		const shouldOverride = color || opacity !== 1 || hasRooms;

		if (shouldOverride) {
			clonedScene.traverse((child) => {
				if (child instanceof Mesh && child.material) {
					if (Array.isArray(child.material)) {
						for (let i = 0; i < child.material.length; i++) {
							const mat = child.material[i];
							// Clone the material to avoid affecting other instances
							const clonedMat = mat.clone();
							clonedMaterialsRef.current.push(clonedMat);

							// Only override color if explicitly provided
							if (color && clonedMat.color) {
								clonedMat.color.set(color);
							}

							// Only set transparency if opacity is not 1
							if (opacity !== 1) {
								clonedMat.transparent = true;
								clonedMat.opacity = opacity;
							}

							// Apply room-specific settings
							if (hasRooms) {
								clonedMat.depthWrite = false;
								clonedMat.side = 2; // DoubleSide
							}

							// Ensure proper material properties
							if (clonedMat.metalness !== undefined) {
								clonedMat.metalness = 0.1;
							}
							if (clonedMat.roughness !== undefined) {
								clonedMat.roughness = 0.5;
							}

							// Replace the material in the array
							child.material[i] = clonedMat;
						}
					} else if (child.material) {
						// Clone the material to avoid affecting other instances
						const clonedMat = child.material.clone();
						clonedMaterialsRef.current.push(clonedMat);

						// Only override color if explicitly provided
						if (color && clonedMat.color) {
							clonedMat.color.set(color);
						}

						// Only set transparency if opacity is not 1
						if (opacity !== 1) {
							clonedMat.transparent = true;
							clonedMat.opacity = opacity;
						}

						// Apply room-specific settings
						if (hasRooms) {
							clonedMat.depthWrite = false;
							clonedMat.side = 2; // DoubleSide
						}

						// Ensure proper material properties for standard materials
						if (clonedMat.metalness !== undefined) {
							clonedMat.metalness = 0.1;
						}
						if (clonedMat.roughness !== undefined) {
							clonedMat.roughness = 0.5;
						}

						// Replace the material
						child.material = clonedMat;
					}
				}
			});
		}

		// Cleanup function
		return () => {
			for (const mat of clonedMaterialsRef.current) {
				if (mat.dispose) {
					mat.dispose();
				}
			}
			clonedMaterialsRef.current = [];
		};
	}, [clonedScene, color, opacity, hasRooms]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === "Enter" || e.key === " ") && onClick) {
				// Prevent default behavior and trigger click
				e.preventDefault();
				// We'll just call the click handler directly without the event object
				// since the building ID is already available in the closure
			}
		},
		[onClick],
	);

	// Don't render if scene is not loaded
	if (!clonedScene) {
		// Fallback to simple box geometry if GLB model fails to load
		return (
			<group>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<mesh
					position={position}
					scale={scale}
					rotation={rotation}
					onClick={onClick}
					onPointerOver={onPointerOver}
					onPointerOut={onPointerOut}
				>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial
						color={color || "#8B7355"}
						transparent={true}
						opacity={opacity}
						metalness={0.1}
						roughness={0.5}
					/>
				</mesh>

				{/* Highlighted material overlay */}
				{isHighlighted && (
					<mesh position={position} scale={scale} rotation={rotation}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color="#f59e42"
							// metalness={0.3}
							roughness={0.3}
							transparent={true}
							opacity={0.8}
						/>
					</mesh>
				)}

				{/* Outline mesh for hover/selection effect */}
				{(isHovered || isSelected) && !hasRooms && (
					<mesh position={position} scale={scale.clone().multiplyScalar(1.05)}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color="#ffffff"
							transparent={true}
							opacity={0.3}
							side={2}
							depthWrite={false}
						/>
					</mesh>
				)}
			</group>
		);
	}

	return (
		<group>
			<primitive
				ref={buildingRef}
				object={clonedScene}
				position={position}
				scale={scale}
				rotation={rotation}
				onClick={onClick}
				onKeyDown={handleKeyDown}
				onPointerOver={onPointerOver}
				onPointerOut={onPointerOut}
				tabIndex={onClick ? 0 : undefined}
			/>

			{/* Highlighted material overlay */}
			{isHighlighted && (
				<primitive
					object={clonedScene.clone()}
					position={position}
					scale={scale}
					rotation={rotation}
				>
					<meshStandardMaterial
						color="#f59e42"
						metalness={0.3}
						roughness={0.3}
						transparent={true}
						opacity={0.8}
					/>
				</primitive>
			)}

			{/* Outline mesh for hover/selection effect */}
			{(isHovered || isSelected) && !hasRooms && (
				<mesh position={position} scale={scale.clone().multiplyScalar(1.05)}>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial
						color="#ffffff"
						transparent={true}
						opacity={0.3}
						side={2}
						depthWrite={false}
					/>
				</mesh>
			)}
		</group>
	);
}

export function BuildingRenderer({
	buildings,
	corridors,
	rooms,
	onBuildingClick,
	onCorridorClick,
	highlightedCorridorIds = [],
	highlightedBuildingIds = [],
	showBuildings = true,
	showRooms = true,
	fromId,
	toId,
	selectedBuildingId,
	selectedRoomId,
}: BuildingRendererProps) {
	const buildingRefs = useRef<Map<string, Mesh>>(new Map());
	const roomRefs = useRef<Map<string, Mesh>>(new Map());
	const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
	const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(
		null,
	);
	const pathIndicatorRef = useRef<Mesh>(null);
	const animationTime = useRef(0);

	// Get label visibility from Zustand store
	const { showBuildingLabels, showRoomLabels } = useLabelStore();

	// Preload models that are actually used by the buildings being rendered
	useEffect(() => {
		const uniqueModelPaths = getUniqueModelPaths(buildings);
		for (const modelPath of uniqueModelPaths) {
			useGLTF.preload(modelPath);
		}
	}, [buildings]);

	// Helper functions to determine destination status
	const isFromDestination = useCallback(
		(id: string) => {
			return fromId === id;
		},
		[fromId],
	);

	const isToDestination = useCallback(
		(id: string) => {
			return toId === id;
		},
		[toId],
	);

	const isDestination = useCallback(
		(id: string) => {
			return isFromDestination(id) || isToDestination(id);
		},
		[isFromDestination, isToDestination],
	);

	// Get destination color based on type
	const getDestinationColor = useCallback(
		(id: string) => {
			if (isFromDestination(id)) {
				return "#D1D8BE"; // Green for from destination
			}
			if (isToDestination(id)) {
				return "#80D8C3"; // Red for to destination
			}
			return null;
		},
		[isFromDestination, isToDestination],
	);

	// Should show label for destination (auto-show for destinations)
	const shouldShowLabel = useCallback(
		(id: string, defaultShow: boolean) => {
			return defaultShow || isDestination(id);
		},
		[isDestination],
	);

	// Reset animation time when path changes
	useEffect(() => {
		animationTime.current = 0;
	}, [highlightedCorridorIds]);

	const roomsByBuilding = useMemo(() => {
		const grouped = new Map<string, Room[]>();
		for (const room of rooms) {
			if (!grouped.has(room.buildingId)) {
				grouped.set(room.buildingId, []);
			}
			const buildingRooms = grouped.get(room.buildingId);
			if (buildingRooms) {
				buildingRooms.push(room);
			}
		}
		return grouped;
	}, [rooms]);

	// Memoize path calculation to prevent recalculation on every frame
	const pathData = useMemo(() => {
		if (highlightedCorridorIds.length === 0) return null;

		// Get highlighted corridors in the correct order from pathfinding
		const highlightedCorridors: Corridor[] = [];
		for (const corridorId of highlightedCorridorIds) {
			const corridor = corridors.find((c) => c.id === corridorId);
			if (corridor) {
				highlightedCorridors.push(corridor);
			}
		}

		if (highlightedCorridors.length === 0) return null;

		// Create a continuous path by following each corridor's geometry
		const pathPoints: Vector3[] = [];

		// First, let's create a map of points to their connected corridors
		const pointConnections = new Map<
			string,
			{ pos: Vector3; corridors: Corridor[] }
		>();

		// Helper to get point key
		const getPointKey = (x: number, z: number) => `${x},${z}`;

		// Build connections map
		for (const corridor of highlightedCorridors) {
			const startKey = getPointKey(corridor.start[0], corridor.start[2]);
			const endKey = getPointKey(corridor.end[0], corridor.end[2]);

			if (!pointConnections.has(startKey)) {
				pointConnections.set(startKey, {
					pos: new Vector3(corridor.start[0], 0, corridor.start[2]),
					corridors: [],
				});
			}
			if (!pointConnections.has(endKey)) {
				pointConnections.set(endKey, {
					pos: new Vector3(corridor.end[0], 0, corridor.end[2]),
					corridors: [],
				});
			}

			const startPoint = pointConnections.get(startKey);
			const endPoint = pointConnections.get(endKey);
			if (startPoint && endPoint) {
				startPoint.corridors.push(corridor);
				endPoint.corridors.push(corridor);
			}
		}

		// Find entry point (point with only one connection)
		let entryPoint: Vector3 | undefined;
		let currentKey: string | undefined;

		for (const [key, data] of pointConnections.entries()) {
			if (data.corridors.length === 1) {
				entryPoint = data.pos;
				currentKey = key;
				break;
			}
		}

		if (entryPoint) {
			// Build ordered path
			pathPoints.push(entryPoint);
			const visitedCorridors = new Set<string>();

			while (currentKey) {
				const currentPoint = pointConnections.get(currentKey);
				if (!currentPoint) break;

				// Find next unvisited corridor
				const nextCorridor = currentPoint.corridors.find(
					(c) => !visitedCorridors.has(c.id),
				);
				if (!nextCorridor) break;

				visitedCorridors.add(nextCorridor.id);

				// Determine which end is the next point
				const nextKey =
					getPointKey(nextCorridor.start[0], nextCorridor.start[2]) ===
					currentKey
						? getPointKey(nextCorridor.end[0], nextCorridor.end[2])
						: getPointKey(nextCorridor.start[0], nextCorridor.start[2]);

				const nextPoint = pointConnections.get(nextKey);
				if (nextPoint) {
					pathPoints.push(nextPoint.pos);
					currentKey = nextKey;
				} else {
					break;
				}
			}
		}

		// Calculate total path length
		let totalLength = 0;
		for (let i = 1; i < pathPoints.length; i++) {
			totalLength += pathPoints[i - 1].distanceTo(pathPoints[i]);
		}

		return { pathPoints, totalLength };
	}, [highlightedCorridorIds, corridors]);

	// Memoize building positions and scales to prevent unnecessary object creation
	const buildingPositions = useMemo(() => {
		const positions = new Map<string, Vector3>();
		const scales = new Map<string, Vector3>();

		for (const building of buildings) {
			positions.set(
				building.id,
				new Vector3(
					building.position[0],
					0, // Set Y to ground level to align with rooms
					building.position[2],
				),
			);
			scales.set(building.id, new Vector3(...building.size));
		}

		return { positions, scales };
	}, [buildings]);

	// Memoize room positions and scales to prevent unnecessary object creation
	const roomPositions = useMemo(() => {
		const positions = new Map<string, Vector3>();
		const scales = new Map<string, Vector3>();

		for (const room of rooms) {
			positions.set(
				room.id,
				new Vector3(
					room.position[0],
					room.position[1] + (room.size[1] - 1) / 2,
					room.position[2],
				),
			);
			scales.set(room.id, new Vector3(...room.size));
		}

		return { positions, scales };
	}, [rooms]);

	const handleBuildingClick = (
		id: string,
		roomId: string | undefined,
		event: ThreeEvent<MouseEvent>,
	) => {
		event.stopPropagation();
		onBuildingClick?.(id, roomId);
	};

	const handleCorridorClick = (id: string, event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		onCorridorClick?.(id);
	};

	const handleBuildingHover = useCallback((buildingId: string) => {
		setHoveredBuildingId(buildingId);
	}, []);

	const handleBuildingHoverOut = useCallback(() => {
		setHoveredBuildingId(null);
	}, []);

	const handleRoomHover = useCallback((roomId: string) => {
		setHoveredRoomId(roomId);
	}, []);

	const handleRoomHoverOut = useCallback(() => {
		setHoveredRoomId(null);
	}, []);

	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#E4E0E1" }),
		[],
	);

	// Optimized animated path indicator
	useFrame((state) => {
		if (pathIndicatorRef.current && pathData) {
			animationTime.current += state.clock.getDelta() * 25;

			const { pathPoints, totalLength } = pathData;

			if (pathPoints.length > 1) {
				// Linear motion that resets at the end
				const duration = 2; // seconds for one complete path traversal
				const t = (animationTime.current % duration) / duration;
				const targetDistance = t * totalLength;

				// Find current segment by accumulating distances
				let currentSegment = 0;
				let localProgress = 0;
				let accumulatedLength = 0;

				// Walk through segments until we find the current one
				for (let i = 1; i < pathPoints.length; i++) {
					const segmentLength = pathPoints[i - 1].distanceTo(pathPoints[i]);
					if (targetDistance <= accumulatedLength + segmentLength) {
						currentSegment = i - 1;
						localProgress =
							(targetDistance - accumulatedLength) / segmentLength;
						break;
					}
					accumulatedLength += segmentLength;
				}

				// Ensure we don't go out of bounds
				if (currentSegment >= pathPoints.length - 1) {
					currentSegment = pathPoints.length - 2;
					localProgress = 1;
				}

				// Interpolate position within current segment
				const startPoint = pathPoints[currentSegment];
				const endPoint = pathPoints[currentSegment + 1];
				const position = new Vector3().lerpVectors(
					startPoint,
					endPoint,
					localProgress,
				);

				pathIndicatorRef.current.position.set(position.x, 0.1, position.z);
			}
		}
	});

	return (
		<group>
			{/* Sky background */}
			<Sky
				distance={450000}
				sunPosition={[0, 1, 0]}
				inclination={0.5}
				azimuth={0.25}
				rayleigh={0.5}
				mieCoefficient={0.005}
				mieDirectionalG={0.8}
			/>

			{highlightedCorridorIds.length > 0 && (
				<mesh ref={pathIndicatorRef} position={[0, 0.1, 0]}>
					<sphereGeometry args={[0.2, 16, 16]} />
					<meshStandardMaterial
						color="#ff0000"
						emissive="#ff0000"
						emissiveIntensity={0.5}
						transparent={true}
						opacity={1}
					/>
				</mesh>
			)}

			{showBuildings &&
				buildings.map((building) => {
					const buildingRooms = roomsByBuilding.get(building.id) || [];
					const hasRooms = building.hasRooms && buildingRooms.length > 0;
					const isHovered = hoveredBuildingId === building.id;
					const isSelected = selectedBuildingId === building.id;
					const isHighlighted = highlightedBuildingIds.includes(building.id);
					const buildingPosition = buildingPositions.positions.get(building.id);
					const buildingScale = buildingPositions.scales.get(building.id);

					if (!buildingPosition || !buildingScale) return null;

					return (
						<group key={building.id}>
							<BuildingModel
								building={building}
								position={buildingPosition}
								scale={buildingScale}
								color={getDestinationColor(building.id) || undefined}
								rotation={building.rotation}
								hasRooms={hasRooms}
								isHighlighted={isHighlighted}
								isSelected={isSelected}
								opacity={1}
								isHovered={isHovered}
								onClick={
									!hasRooms
										? (e) => handleBuildingClick(building.id, undefined, e)
										: undefined
								}
								onPointerOver={
									!hasRooms
										? (e) => {
												e.stopPropagation();
												handleBuildingHover(building.id);
											}
										: undefined
								}
								onPointerOut={
									!hasRooms
										? (e) => {
												e.stopPropagation();
												handleBuildingHoverOut();
											}
										: undefined
								}
							/>

							{building.name &&
								shouldShowLabel(building.id, showBuildingLabels) && (
									<Html
										center
										position={[0, building.size[1] / 9 + 0.5, 0]}
										style={{
											background: isDestination(building.id)
												? isFromDestination(building.id)
													? "rgba(34, 197, 94, 0.9)"
													: "rgba(239, 68, 68, 0.9)"
												: "#57776d",
											color: "white",
											padding: "4px 8px",
											borderRadius: "4px",
											fontSize: "12px",
											whiteSpace: "nowrap",
											pointerEvents: "none",
											fontWeight: isDestination(building.id)
												? "bold"
												: "normal",
										}}
									>
										{isDestination(building.id)
											? `${building.name} (${
													isFromDestination(building.id) ? "FROM" : "TO"
												})`
											: building.name}
									</Html>
								)}
						</group>
					);
				})}

			{showRooms &&
				rooms.map((room) => {
					const isHovered = hoveredRoomId === room.id;
					const isSelected = selectedRoomId === room.id;

					return (
						<group key={room.id}>
							<mesh
								ref={(ref) => {
									if (ref) roomRefs.current.set(room.id, ref);
								}}
								position={roomPositions.positions.get(room.id)}
								scale={roomPositions.scales.get(room.id)}
								onPointerOver={(e) => {
									e.stopPropagation();
									handleRoomHover(room.id);
								}}
								onPointerDown={(e) => {
									e.stopPropagation();
									handleBuildingClick(room.buildingId, room.id, e);
								}}
								onPointerOut={(e) => {
									e.stopPropagation();
									handleRoomHoverOut();
								}}
								renderOrder={2}
							>
								<boxGeometry args={[1, 1, 1]} />
								<meshStandardMaterial
									color={getDestinationColor(room.id) || room.color}
									transparent={true}
									opacity={1}
									metalness={hoveredRoomId === room.id ? 0.3 : 0.1}
									roughness={hoveredRoomId === room.id ? 0.3 : 0.5}
									depthWrite={true}
								/>
							</mesh>

							{(isHovered || isSelected) && (
								<mesh
									position={roomPositions.positions.get(room.id)}
									scale={roomPositions.scales.get(room.id)}
									renderOrder={3}
								>
									<boxGeometry args={[1.05, 1.05, 1.05]} />
									<meshStandardMaterial
										color="#ffffff"
										transparent={true}
										opacity={0.3}
										side={2}
										depthWrite={false}
									/>
								</mesh>
							)}

							{/* Room label */}
							{room.name && shouldShowLabel(room.id, showRoomLabels) && (
								<Html
									center
									position={[0, room.size[1] / 2 + 0.5, 0]}
									style={{
										background: isDestination(room.id)
											? isFromDestination(room.id)
												? "rgba(34, 197, 94, 0.9)"
												: "rgba(239, 68, 68, 0.9)"
											: "#23302b",
										color: "white",
										padding: "4px 8px",
										borderRadius: "4px",
										fontSize: "14px",
										whiteSpace: "nowrap",
										pointerEvents: "none",
										fontWeight: isDestination(room.id) ? "bold" : "normal",
									}}
								>
									{isDestination(room.id)
										? `${room.name} (${
												isFromDestination(room.id) ? "FROM" : "TO"
											})`
										: room.name}
								</Html>
							)}
						</group>
					);
				})}

			{corridors.map((corridor) => {
				const startXZ = new Vector3(corridor.start[0], 0, corridor.start[2]);
				const endXZ = new Vector3(corridor.end[0], 0, corridor.end[2]);
				const length = startXZ.distanceTo(endXZ);
				const midPoint = new Vector3()
					.addVectors(startXZ, endXZ)
					.multiplyScalar(0.5);
				const direction = new Vector3().subVectors(endXZ, startXZ).normalize();
				const angle = Math.atan2(direction.z, direction.x);

				if (length === 0) return null;

				return (
					<>
						<mesh
							key={corridor.id}
							position={[midPoint.x, 0.01, midPoint.z]}
							rotation={[-Math.PI / 2, 0, angle]}
							scale={[1, 1, 1]}
							receiveShadow
							material={corridorMaterial}
						>
							<planeGeometry args={[length, corridor.width]} />
						</mesh>
						{highlightedCorridorIds.includes(corridor.id) && (
							<Line
								key={`${corridor.id}-line`}
								points={[
									[corridor.start[0], 0.05, corridor.start[2]],
									[corridor.end[0], 0.05, corridor.end[2]],
								]}
								color="#22d3ee"
								lineWidth={3}
								dashed={false}
							/>
						)}
					</>
				);
			})}

			{corridors.map((corridor) => {
				return [0, 1].map((i) => {
					const point = i === 0 ? corridor.start : corridor.end;
					return (
						// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
						<mesh
							key={`${corridor.id}-joint-${i}`}
							position={[point[0], -0.001, point[2]]}
							onClick={(e) => handleCorridorClick(corridor.id, e)}
							receiveShadow
						>
							<cylinderGeometry
								args={[corridor.width / 2, corridor.width / 2, 0.05, 16]}
							/>
							<meshStandardMaterial color="#E4E0E1" />
						</mesh>
					);
				});
			})}
		</group>
	);
}
