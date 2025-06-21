import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { findCorridorPath } from "@/utils/pathfinding";
import { useCallback } from "react";

interface UseLegacyBuildingClickProps {
	selectedBuildings: string[];
	setSelectedBuildings: (buildings: string[]) => void;
	setPathCorridorIds: (ids: string[]) => void;
	setDirections: (directions: string[]) => void;
	getPositionById: (id: string) => [number, number, number] | null;
	corridors: Corridor[];
	rooms: Room[];
}

export function useLegacyBuildingClick({
	selectedBuildings,
	setSelectedBuildings,
	setPathCorridorIds,
	setDirections,
	getPositionById,
	corridors,
	rooms,
}: UseLegacyBuildingClickProps) {
	const handleBuildingClick = useCallback(
		(id: string, roomId?: string) => {
			// Original pathfinding logic (keep for backward compatibility)
			if (selectedBuildings.length === 0) {
				setSelectedBuildings([id]);
				setPathCorridorIds([]);
				setDirections([]);
				return;
			}

			if (selectedBuildings.length === 1) {
				if (selectedBuildings[0] === id) return;
				const firstPos = getPositionById(selectedBuildings[0]);
				const secondPos = getPositionById(id);
				if (firstPos && secondPos) {
					const path = findCorridorPath(
						corridors,
						rooms,
						[firstPos[0], 0, firstPos[2]],
						[secondPos[0], 0, secondPos[2]],
					);
					setPathCorridorIds(path);
					if (path.length === 0) {
						setDirections(["No path found between the selected buildings."]);
					} else {
						const steps = path.map((pathId, idx) => {
							const corridor = corridors.find((c) => c.id === pathId);
							const room = rooms.find((r) => r.id === pathId);

							if (corridor) {
								const from =
									idx === 0
										? [firstPos[0], 0, firstPos[2]]
										: [
												corridors.find((c) => c.id === path[idx - 1])?.end[0] ??
													0,
												0,
												corridors.find((c) => c.id === path[idx - 1])?.end[2] ??
													0,
											];
								const to = [corridor.end[0], 0, corridor.end[2]];
								return `Take corridor ${corridor.id} from (${from}) to (${to})`;
							}
							if (room) {
								return `Enter room ${room.name} at position (${room.position})`;
							}
							return "";
						});
						setDirections(steps);
					}
				}
				setSelectedBuildings([]);
				return;
			}

			setSelectedBuildings([id]);
			setPathCorridorIds([]);
			setDirections([]);
		},
		[
			selectedBuildings,
			setSelectedBuildings,
			setPathCorridorIds,
			setDirections,
			getPositionById,
			corridors,
			rooms,
		],
	);

	return {
		handleBuildingClick,
	};
}
