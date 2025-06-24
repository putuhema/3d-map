import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { useHospitalMapStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import type { UseBuildingRendererProps } from "@/types/building";
import { getUniqueModelPaths } from "@/utils/buildingModels";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vector3 } from "three";

export function useBuildingRenderer({
	buildings,
	corridors,
	rooms,
	highlightedCorridorIds,
}: UseBuildingRendererProps) {
	const { fromId, toId } = useSearch({ strict: false });
	const { startingLocationId } = useHospitalMapStore();
	const { camera } = useThree();
	const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
	const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(
		null,
	);
	const animationTime = useRef(0);
	const cameraPositionRef = useRef(new Vector3());
	const corridorsRef = useRef(corridors);

	// Use starting location as fromId if available and no fromId is set
	const effectiveFromId = fromId || startingLocationId;

	// Update corridors ref when corridors change
	useEffect(() => {
		corridorsRef.current = corridors;
	}, [corridors]);

	// Distance threshold for label visibility (in world units)
	const LABEL_DISTANCE_THRESHOLD = 50;

	// Update camera position ref
	useEffect(() => {
		cameraPositionRef.current.copy(camera.position);
	}, [camera.position]);

	// Preload models that are actually used by the buildings being rendered
	useEffect(() => {
		const uniqueModelPaths = getUniqueModelPaths(buildings);
		for (const modelPath of uniqueModelPaths) {
			useGLTF.preload(modelPath);
		}
	}, [buildings]);

	// Helper functions to determine destination status
	const isFromDestination = useCallback(
		(id: string) => effectiveFromId === id,
		[effectiveFromId],
	);

	const isToDestination = useCallback((id: string) => toId === id, [toId]);

	const isDestination = useCallback(
		(id: string) => isFromDestination(id) || isToDestination(id),
		[isFromDestination, isToDestination],
	);

	// Get destination color based on type
	const getDestinationColor = useCallback(
		(id: string) => {
			if (isFromDestination(id)) return "#D1D8BE";
			if (isToDestination(id)) return "#80D8C3";
			return undefined;
		},
		[isFromDestination, isToDestination],
	);

	// Function to check if a building is close enough to show its label
	const isBuildingCloseEnough = useCallback((buildingPosition: Vector3) => {
		const distance = cameraPositionRef.current.distanceTo(buildingPosition);
		return distance <= LABEL_DISTANCE_THRESHOLD;
	}, []);

	// Reset animation time when path changes
	useEffect(() => {
		animationTime.current = 0;
	}, [highlightedCorridorIds]);

	// Group rooms by building
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

	// Memoize path calculation
	const pathData = useMemo(() => {
		if (highlightedCorridorIds.length === 0) {
			return null;
		}

		const highlightedCorridors: Corridor[] = [];
		for (const corridorId of highlightedCorridorIds) {
			const corridor = corridorsRef.current.find((c) => c.id === corridorId);
			if (corridor) {
				highlightedCorridors.push(corridor);
			}
		}

		if (highlightedCorridors.length === 0) {
			return null;
		}

		const pathPoints: Vector3[] = [];
		const pointConnections = new Map<
			string,
			{ pos: Vector3; corridors: Corridor[] }
		>();

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

		// Find entry point
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
			pathPoints.push(entryPoint);
			const visitedCorridors = new Set<string>();

			while (currentKey) {
				const currentPoint = pointConnections.get(currentKey);
				if (!currentPoint) break;

				const nextCorridor = currentPoint.corridors.find(
					(c) => !visitedCorridors.has(c.id),
				);
				if (!nextCorridor) break;

				visitedCorridors.add(nextCorridor.id);

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
	}, [highlightedCorridorIds]);

	// Memoize building positions and scales
	const buildingPositions = useMemo(() => {
		const positions = new Map<string, Vector3>();
		const scales = new Map<string, Vector3>();

		for (const building of buildings) {
			positions.set(
				building.id,
				new Vector3(building.position[0], 0, building.position[2]),
			);
			scales.set(building.id, new Vector3(...building.size));
		}

		return { positions, scales };
	}, [buildings]);

	// Memoize room positions and scales
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

	// Event handlers
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

	return {
		// State
		hoveredRoomId,
		hoveredBuildingId,
		animationTime,

		// Computed data
		roomsByBuilding,
		pathData,
		buildingPositions,
		roomPositions,

		// Helper functions
		isFromDestination,
		isToDestination,
		isDestination,
		getDestinationColor,
		isBuildingCloseEnough,

		// Event handlers
		handleBuildingHover,
		handleBuildingHoverOut,
		handleRoomHover,
		handleRoomHoverOut,
	};
}
