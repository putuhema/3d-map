import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { useNavigationStore } from "@/lib/store";
import { findCorridorPath } from "@/utils/pathfinding";
import { useCallback } from "react";

interface UseNavigationProps {
	corridors: Corridor[];
	rooms: Room[];
	playerPosition: { x: number; z: number };
	getPositionById: (id: string) => [number, number, number] | null;
	getRoomById: (id: string) => Room | undefined;
	getBuildingById: (id: string) => Building | undefined;
}

export function useNavigation({
	corridors,
	rooms,
	playerPosition,
	getPositionById,
	getRoomById,
	getBuildingById,
}: UseNavigationProps) {
	const { fromId, toId, setFromId, setToId } = useNavigationStore();

	const handleFromSelect = useCallback(
		(id: string, type: "building" | "room" | "corridor") => {
			setFromId(id);
		},
		[setFromId],
	);

	const handleToSelect = useCallback(
		(id: string, type: "building" | "room" | "corridor") => {
			setToId(id);
		},
		[setToId],
	);

	const handleUseCurrentLocation = useCallback(() => {
		setFromId("current");
	}, [setFromId]);

	const findPath = useCallback(() => {
		// Safety checks
		if (!fromId || !toId || fromId === toId) {
			return { path: [], directions: [] };
		}

		// Check if data is available
		if (!corridors || corridors.length === 0 || !rooms) {
			console.warn("No corridor or room data available for pathfinding");
			return { path: [], directions: ["No navigation data available."] };
		}

		// Validate player position for current location
		if (fromId === "current") {
			if (
				!Number.isFinite(playerPosition.x) ||
				!Number.isFinite(playerPosition.z)
			) {
				console.warn("Invalid player position for pathfinding");
				return { path: [], directions: ["Invalid player position."] };
			}
		}

		let fromPos: [number, number, number] | null = null;

		if (fromId === "current") {
			fromPos = [playerPosition.x, 0, playerPosition.z];
		} else {
			fromPos = getPositionById(fromId);
		}

		const toPos = getPositionById(toId);

		// Validate positions
		if (!fromPos || !toPos) {
			return {
				path: [],
				directions: ["Could not find positions for selected locations."],
			};
		}

		// Check if positions are valid numbers
		if (
			!fromPos.every((coord) => Number.isFinite(coord)) ||
			!toPos.every((coord) => Number.isFinite(coord))
		) {
			console.warn("Invalid positions detected in pathfinding");
			return { path: [], directions: ["Invalid position data."] };
		}

		try {
			const path = findCorridorPath(
				corridors,
				rooms,
				[fromPos[0], 0, fromPos[2]],
				[toPos[0], 0, toPos[2]],
			);

			if (path.length === 0) {
				return {
					path: [],
					directions: ["No path found between the selected locations."],
				};
			}

			const steps = path
				.map((pathId, idx) => {
					const corridor = corridors.find((c) => c.id === pathId);
					const room = rooms.find((r) => r.id === pathId);

					if (corridor) {
						const from =
							idx === 0
								? [fromPos?.[0] ?? 0, 0, fromPos?.[2] ?? 0]
								: [
										corridors.find((c) => c.id === path[idx - 1])?.end[0] ?? 0,
										0,
										corridors.find((c) => c.id === path[idx - 1])?.end[2] ?? 0,
									];
						const to = [corridor.end[0], 0, corridor.end[2]];
						return `Take corridor ${corridor.id} from (${from}) to (${to})`;
					}
					if (room) {
						return `Enter room ${room.name} at position (${room.position})`;
					}
					return "";
				})
				.filter((step) => step !== ""); // Remove empty steps

			return { path, directions: steps };
		} catch (error) {
			console.error("Error during pathfinding:", error);
			return { path: [], directions: ["Error occurred during pathfinding."] };
		}
	}, [fromId, toId, getPositionById, corridors, rooms, playerPosition]);

	const resetNavigation = useCallback(() => {
		setFromId(null);
		setToId(null);
	}, [setFromId, setToId]);

	return {
		fromId,
		toId,
		handleFromSelect,
		handleToSelect,
		handleUseCurrentLocation,
		findPath,
		resetNavigation,
	};
}
