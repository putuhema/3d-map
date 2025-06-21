import type { Building } from "@/data/building";

// Available building models
export const BUILDING_MODELS = {
	DEFAULT: "/models/building.glb",
	ROTATED_90: "/models/building-90.glb",
} as const;

export type BuildingModelType =
	(typeof BUILDING_MODELS)[keyof typeof BUILDING_MODELS];

/**
 * Get the model path for a building
 * @param building - The building object
 * @returns The model path to use for this building
 */
export function getBuildingModelPath(building: Building): string {
	return (
		BUILDING_MODELS[building.modelPath as keyof typeof BUILDING_MODELS] ||
		BUILDING_MODELS.DEFAULT
	);
}

/**
 * Check if a building uses a custom model
 * @param building - The building object
 * @returns True if the building uses a custom model
 */
export function hasCustomModel(building: Building): boolean {
	return !!building.modelPath;
}

/**
 * Get all unique model paths used by buildings
 * @param buildings - Array of buildings
 * @returns Array of unique model paths
 */
export function getUniqueModelPaths(buildings: Building[]): string[] {
	const paths = new Set<string>();

	for (const building of buildings) {
		paths.add(getBuildingModelPath(building));
	}

	return Array.from(paths);
}

/**
 * Group buildings by their model type
 * @param buildings - Array of buildings
 * @returns Map of model paths to building arrays
 */
export function groupBuildingsByModel(
	buildings: Building[],
): Map<string, Building[]> {
	const groups = new Map<string, Building[]>();

	for (const building of buildings) {
		const modelPath = getBuildingModelPath(building);
		if (!groups.has(modelPath)) {
			groups.set(modelPath, []);
		}
		const buildingGroup = groups.get(modelPath);
		if (buildingGroup) {
			buildingGroup.push(building);
		}
	}

	return groups;
}

/**
 * Validate that a model path is supported
 * @param modelPath - The model path to validate
 * @returns True if the model path is supported
 */
export function isValidModelPath(modelPath: string): boolean {
	return Object.values(BUILDING_MODELS).includes(
		modelPath as BuildingModelType,
	);
}
