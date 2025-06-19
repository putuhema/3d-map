import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { useLabelStore } from "@/lib/store";
import { Html, Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { MeshStandardMaterial, Vector3 } from "three";
import type { Mesh } from "three";

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
}: BuildingRendererProps) {
	const buildingRefs = useRef<Map<string, Mesh>>(new Map());
	const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
	const pathIndicatorRef = useRef<Mesh>(null);
	const animationTime = useRef(0);

	// Get label visibility from Zustand store
	const { showBuildingLabels, showRoomLabels } = useLabelStore();

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

	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#d4d4d8" }),
		[],
	);

	// Animated path indicator
	useFrame((state) => {
		if (pathIndicatorRef.current && highlightedCorridorIds.length > 0) {
			animationTime.current += state.clock.getDelta() * 25;

			// Get highlighted corridors in the correct order from pathfinding
			const highlightedCorridors: Corridor[] = [];
			for (const corridorId of highlightedCorridorIds) {
				const corridor = corridors.find((c) => c.id === corridorId);
				if (corridor) {
					highlightedCorridors.push(corridor);
				}
			}

			if (highlightedCorridors.length > 0) {
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
			{/* Animated path indicator */}
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

					return (
						// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
						<mesh
							key={building.id}
							ref={(ref) => {
								if (ref) buildingRefs.current.set(building.id, ref);
							}}
							position={
								new Vector3(
									building.position[0],
									building.position[1] + (building.size[1] - 1) / 2,
									building.position[2],
								)
							}
							scale={new Vector3(...building.size)}
							onClick={(e) => handleBuildingClick(building.id, undefined, e)}
							castShadow
							receiveShadow
						>
							<boxGeometry args={[1, 1, 1]} />
							<meshStandardMaterial
								color={building.color}
								metalness={0.1}
								roughness={0.5}
								attach="material"
								transparent={true}
								opacity={hasRooms ? 0.4 : 1}
							/>
							{highlightedBuildingIds.includes(building.id) && (
								<meshStandardMaterial
									color="#f59e42"
									metalness={0.3}
									roughness={0.3}
									transparent={true}
									opacity={0.8}
									attach="material"
								/>
							)}
							{building.name && showBuildingLabels && (
								<Html
									center
									position={[0, building.size[1] / 9 + 0.5, 0]}
									style={{
										background: "rgba(152, 205, 0, 0.8)",
										color: "white",
										padding: "4px 8px",
										borderRadius: "4px",
										fontSize: "12px",
										whiteSpace: "nowrap",
										pointerEvents: "none",
									}}
								>
									{building.name}
								</Html>
							)}
						</mesh>
					);
				})}

			{showRooms &&
				rooms.map((room) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
					<mesh
						key={room.id}
						position={
							new Vector3(
								room.position[0],
								room.position[1] + (room.size[1] - 1) / 2,
								room.position[2],
							)
						}
						scale={new Vector3(...room.size)}
						onClick={(e) => handleBuildingClick(room.buildingId, room.id, e)}
						onPointerOver={(e) => {
							e.stopPropagation();
							setHoveredRoomId(room.id);
						}}
						onPointerOut={(e) => {
							e.stopPropagation();
							setHoveredRoomId(null);
						}}
					>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color={room.color}
							transparent={true}
							opacity={1}
							metalness={hoveredRoomId === room.id ? 0.3 : 0.1}
							roughness={hoveredRoomId === room.id ? 0.3 : 0.5}
						/>
						{room.name && showRoomLabels && (
							<Html
								center
								position={[0, room.size[1] / 2 + 0.5, 0]}
								style={{
									background: "rgba(0, 0, 0, 0.8)",
									color: "white",
									padding: "4px 8px",
									borderRadius: "4px",
									fontSize: "14px",
									whiteSpace: "nowrap",
									pointerEvents: "none",
								}}
							>
								{room.name}
							</Html>
						)}
					</mesh>
				))}

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
							<meshStandardMaterial color="#d4d4d8" />
						</mesh>
					);
				});
			})}
		</group>
	);
}
