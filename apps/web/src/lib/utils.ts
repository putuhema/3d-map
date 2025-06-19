import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Get all rooms that belong to a specific building
 */
export function getRoomsForBuilding(buildingId: string, rooms: Room[]): Room[] {
	return rooms.filter((room) => room.buildingId === buildingId);
}

/**
 * Get the building that contains a specific room
 */
export function getBuildingForRoom(
	roomId: string,
	rooms: Room[],
	buildings: Building[],
): Building | undefined {
	const room = rooms.find((r) => r.id === roomId);
	if (!room) return undefined;
	return buildings.find((b) => b.id === room.buildingId);
}

/**
 * Check if a building has any rooms
 */
export function buildingHasRooms(buildingId: string, rooms: Room[]): boolean {
	return rooms.some((room) => room.buildingId === buildingId);
}

/**
 * Get all buildings that contain rooms
 */
export function getBuildingsWithRooms(
	buildings: Building[],
	rooms: Room[],
): Building[] {
	return buildings.filter(
		(building) => building.hasRooms && buildingHasRooms(building.id, rooms),
	);
}

/**
 * Find the best building for room placement based on position and availability
 */
export function findBestBuildingForRoom(
	roomPosition: [number, number, number],
	buildings: Building[],
	rooms: Room[],
): Building | null {
	// First, try to find buildings that are designed to have rooms
	const buildingsWithRooms = buildings.filter((b) => b.hasRooms);

	if (buildingsWithRooms.length === 0) {
		return null;
	}

	// Find the closest building that can have rooms
	let closestBuilding: Building | null = null;
	let closestDistance = Number.POSITIVE_INFINITY;

	for (const building of buildingsWithRooms) {
		const distance = Math.sqrt(
			(roomPosition[0] - building.position[0]) ** 2 +
				(roomPosition[2] - building.position[2]) ** 2,
		);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestBuilding = building;
		}
	}

	return closestBuilding;
}
