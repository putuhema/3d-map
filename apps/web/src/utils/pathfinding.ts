import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";

// Helper: Check if two positions are equal (ignoring y)
export function positionsEqual(
	a: [number, number, number],
	b: [number, number, number],
) {
	return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[2] - b[2]) < 0.01;
}

// Helper: Generate a key for a position using only x and z
export function posKey(pos: [number, number, number]) {
	return `${pos[0]},${pos[2]}`;
}

// Pathfinding: BFS over corridors and rooms
export function findCorridorPath(
	corridors: Corridor[],
	rooms: Room[],
	startPos: [number, number, number],
	endPos: [number, number, number],
): string[] {
	// Build adjacency list: Map position string -> {corridor/room ids, nextPos}
	const posToPaths = new Map<
		string,
		{
			id: string;
			type: "corridor" | "room";
			nextPos: [number, number, number];
		}[]
	>();

	// Add corridors to adjacency list
	for (const corridor of corridors) {
		const startKey = posKey(corridor.start);
		const endKey = posKey(corridor.end);
		if (!posToPaths.has(startKey)) posToPaths.set(startKey, []);
		if (!posToPaths.has(endKey)) posToPaths.set(endKey, []);
		posToPaths.get(startKey)?.push({
			id: corridor.id,
			type: "corridor",
			nextPos: corridor.end,
		});
		posToPaths.get(endKey)?.push({
			id: corridor.id,
			type: "corridor",
			nextPos: corridor.start,
		});
	}

	// Add rooms to adjacency list
	for (const room of rooms) {
		const roomPos = room.position;
		const roomKey = posKey(roomPos);
		if (!posToPaths.has(roomKey)) posToPaths.set(roomKey, []);

		// Connect room to nearby corridors
		for (const corridor of corridors) {
			const startKey = posKey(corridor.start);
			const endKey = posKey(corridor.end);

			// Check if room is near corridor start
			if (
				Math.hypot(
					roomPos[0] - corridor.start[0],
					roomPos[2] - corridor.start[2],
				) < 1
			) {
				posToPaths.get(roomKey)?.push({
					id: corridor.id,
					type: "corridor",
					nextPos: corridor.end,
				});
				posToPaths.get(startKey)?.push({
					id: room.id,
					type: "room",
					nextPos: roomPos,
				});
			}

			// Check if room is near corridor end
			if (
				Math.hypot(roomPos[0] - corridor.end[0], roomPos[2] - corridor.end[2]) <
				1
			) {
				posToPaths.get(roomKey)?.push({
					id: corridor.id,
					type: "corridor",
					nextPos: corridor.start,
				});
				posToPaths.get(endKey)?.push({
					id: room.id,
					type: "room",
					nextPos: roomPos,
				});
			}
		}
	}

	// BFS with improved visited tracking
	const queue: { pos: [number, number, number]; path: string[] }[] = [
		{ pos: [startPos[0], 0, startPos[2]], path: [] },
	];
	const visited = new Set<string>();
	const maxIterations = 1000; // Safety limit to prevent infinite loops
	let iterations = 0;

	while (queue.length > 0 && iterations < maxIterations) {
		iterations++;
		const current = queue.shift();
		if (!current) continue;

		const { pos, path } = current;
		const key = posKey(pos);

		// Check if we've reached the destination
		if (positionsEqual(pos, [endPos[0], 0, endPos[2]])) {
			return path;
		}

		// Skip if already visited
		if (visited.has(key)) continue;
		visited.add(key);

		// Process neighbors
		const neighbors = posToPaths.get(key) || [];
		for (const neighbor of neighbors) {
			const nextPos: [number, number, number] = [
				neighbor.nextPos[0],
				0,
				neighbor.nextPos[2],
			];
			const nextKey = posKey(nextPos);

			// Only add to queue if not visited and not the same as current position
			if (!visited.has(nextKey) && nextKey !== key) {
				queue.push({
					pos: nextPos,
					path: [...path, neighbor.id],
				});
			}
		}
	}

	// If we hit the iteration limit, return empty path
	if (iterations >= maxIterations) {
		console.warn(
			"Pathfinding exceeded maximum iterations, returning empty path",
		);
		return [];
	}

	return [];
}
