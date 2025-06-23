import { useHospitalMapStore } from "@/lib/store";
import { findCorridorPath } from "@/utils/pathfinding";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

export function useHospitalMap() {
	const { fromId, toId } = useSearch({ strict: false });
	const navigate = useNavigate({ from: "/" });

	const {
		corridors,
		rooms,
		getPositionById,
		setPathCorridorIds,
		setDirections,
		setCameraTarget,
	} = useHospitalMapStore();

	const handleFindPath = useCallback(() => {
		if (!fromId || !toId || fromId === toId || fromId === "" || toId === "") {
			return;
		}

		const fromPos = getPositionById(fromId);
		const toPos = getPositionById(toId);

		if (fromPos && toPos) {
			const path = findCorridorPath(
				corridors,
				rooms,
				[fromPos[0], 0, fromPos[2]],
				[toPos[0], 0, toPos[2]],
			);
			setPathCorridorIds(path);
			if (path.length === 0) {
				setDirections(["No path found between the selected locations."]);
			} else {
				const steps = path.map((pathId, idx) => {
					const corridor = corridors.find((c) => c.id === pathId);
					const room = rooms.find((r) => r.id === pathId);

					if (corridor) {
						const from =
							idx === 0
								? [fromPos[0], 0, fromPos[2]]
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
				});
				setDirections(steps);
			}
		}
		navigate({ search: { fromId, toId } });
	}, [
		fromId,
		toId,
		getPositionById,
		corridors,
		rooms,
		setPathCorridorIds,
		setDirections,
		navigate,
	]);

	// Function to calculate camera target for two selected rooms
	const calculateCameraTargetForRooms = useCallback(() => {
		// Only auto-zoom if both fromId and toId are set
		if (!fromId || !toId) return;

		const fromPos = getPositionById(fromId);
		const toPos = getPositionById(toId);

		// Only proceed if we have both positions
		if (!fromPos || !toPos) return;

		// Calculate the direction vector from "from" to "to" destination
		const directionX = toPos[0] - fromPos[0];
		const directionZ = toPos[2] - fromPos[2];

		// Calculate the center point between the two positions
		const centerX = (fromPos[0] + toPos[0]) / 2;
		const centerY = (fromPos[1] + toPos[1]) / 2;
		const centerZ = (fromPos[2] + toPos[2]) / 2;

		// Calculate the distance between the positions to determine appropriate zoom
		const distanceX = Math.abs(toPos[0] - fromPos[0]);
		const distanceZ = Math.abs(toPos[2] - fromPos[2]);
		const maxDistance = Math.max(distanceX, distanceZ);

		// Add some padding to the target (1.5x the distance)
		const padding = Math.max(maxDistance * 1.5, 3); // Minimum padding of 3 units

		// Calculate the normalized direction vector
		const directionLength = Math.sqrt(
			directionX * directionX + directionZ * directionZ,
		);
		const normalizedDirectionX =
			directionLength > 0 ? directionX / directionLength : 0;
		const normalizedDirectionZ =
			directionLength > 0 ? directionZ / directionLength : 0;

		// Offset the camera target to position "from" at bottom and "to" at top
		// Move the target slightly towards the "from" position so it appears at the bottom
		const offsetDistance = maxDistance * 0.25; // 25% of the distance between destinations
		const offsetX = centerX - normalizedDirectionX * offsetDistance;
		const offsetZ = centerZ - normalizedDirectionZ * offsetDistance;

		// Set the camera target to the offset center
		setCameraTarget([offsetX, centerY, offsetZ]);

		// Return the calculated target and distance for zoom adjustment
		return {
			target: [offsetX, centerY, offsetZ] as [number, number, number],
			distance: padding,
		};
	}, [fromId, toId, getPositionById, setCameraTarget]);

	return {
		handleFindPath,
		calculateCameraTargetForRooms,
	};
}
