import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { useCallback, useEffect, useState } from "react";

interface UseCameraProps {
	fromId: string | null;
	toId: string | null;
	playerPosition: { x: number; z: number };
	getRoomById: (id: string) => Room | undefined;
	getBuildingById: (id: string) => Building | undefined;
}

export function useCamera({
	fromId,
	toId,
	playerPosition,
	getRoomById,
	getBuildingById,
}: UseCameraProps) {
	const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
		0, 0, 0,
	]);

	// Function to calculate camera target for two selected rooms
	const calculateCameraTargetForRooms = useCallback(() => {
		// Only auto-zoom if both fromId and toId are set
		if (!fromId || !toId) return;

		let fromPos: [number, number, number] | null = null;
		let toPos: [number, number, number] | null = null;

		// Handle current location case
		if (fromId === "current") {
			fromPos = [playerPosition.x, 0, playerPosition.z];
		} else {
			const fromRoom = getRoomById(fromId);
			const fromBuilding = getBuildingById(fromId);
			if (fromRoom) {
				fromPos = fromRoom.position;
			} else if (fromBuilding) {
				fromPos = fromBuilding.position;
			}
		}

		// Handle destination (can be room or building)
		const toRoom = getRoomById(toId);
		const toBuilding = getBuildingById(toId);

		if (toRoom) {
			toPos = toRoom.position;
		} else if (toBuilding) {
			toPos = toBuilding.position;
		}

		// Only proceed if we have both positions
		if (!fromPos || !toPos) return;

		// Validate positions are finite numbers
		if (
			!fromPos.every((coord) => Number.isFinite(coord)) ||
			!toPos.every((coord) => Number.isFinite(coord))
		) {
			return;
		}

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

		// Validate the calculated target
		const target: [number, number, number] = [offsetX, centerY, offsetZ];
		if (!target.every((coord) => Number.isFinite(coord))) {
			return;
		}

		// Set the camera target to the offset center
		setCameraTarget(target);

		// Return the calculated target and distance for zoom adjustment
		return {
			target,
			distance: padding,
		};
	}, [fromId, toId, getRoomById, getBuildingById, playerPosition]);

	// Effect to recalculate camera target when room selection changes
	useEffect(() => {
		calculateCameraTargetForRooms();
	}, [calculateCameraTargetForRooms]);

	return {
		cameraTarget,
		setCameraTarget,
		calculateCameraTargetForRooms,
	};
}
