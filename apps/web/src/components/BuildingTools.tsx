import { useState } from "react";

export type Building = {
	id: string;
	name: string;
	position: [number, number, number];
	size: [number, number, number];
	color: string;
};

export type Corridor = {
	id: string;
	start: [number, number, number];
	end: [number, number, number];
	width: number;
};

type ToolMode = "place" | "remove" | "corridor";

interface BuildingToolsProps {
	onBuildingPlace: (building: Building) => void;
	onBuildingRemove: (id: string) => void;
	onCorridorDraw: (corridor: Corridor) => void;
	selectedMode: ToolMode;
	onModeChange: (mode: ToolMode) => void;
	buildingName: string;
	onBuildingNameChange: (name: string) => void;
	buildingSize: [number, number, number];
	onBuildingSizeChange: (size: [number, number, number]) => void;
	buildingColor: string;
	onBuildingColorChange: (color: string) => void;
}

export function BuildingTools({
	onBuildingPlace,
	onBuildingRemove,
	onCorridorDraw,
	selectedMode,
	onModeChange,
	buildingName,
	onBuildingNameChange,
	buildingSize,
	onBuildingSizeChange,
	buildingColor,
	onBuildingColorChange,
}: BuildingToolsProps) {
	const [corridorWidth, setCorridorWidth] = useState(1.2);

	const handlePlaceBuilding = (position: [number, number, number]) => {
		if (!buildingName) return;

		const building: Building = {
			id: crypto.randomUUID(),
			name: buildingName,
			position,
			size: buildingSize,
			color: buildingColor,
		};

		onBuildingPlace(building);
	};

	const handleRemoveBuilding = (id: string) => {
		onBuildingRemove(id);
	};

	const handleDrawCorridor = (
		start: [number, number, number],
		end: [number, number, number],
	) => {
		const corridor: Corridor = {
			id: crypto.randomUUID(),
			start,
			end,
			width: corridorWidth,
		};

		onCorridorDraw(corridor);
	};

	return (
		<div className="fixed top-24 right-4 z-10 flex flex-col gap-4">
			<div className="w-[350px] rounded-lg border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
				<h3 className="mb-4 font-semibold text-emerald-700 text-lg">
					Building Tools
				</h3>

				<div className="mb-4 flex gap-2">
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							selectedMode === "place"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => onModeChange("place")}
					>
						Place
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							selectedMode === "remove"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => onModeChange("remove")}
					>
						Remove
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							selectedMode === "corridor"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => onModeChange("corridor")}
					>
						Corridor
					</button>
				</div>

				{selectedMode === "place" && (
					<div className="space-y-3">
						<div>
							<label
								htmlFor="building-name"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Building Name
							</label>
							<input
								id="building-name"
								type="text"
								value={buildingName}
								onChange={(e) => onBuildingNameChange(e.target.value)}
								className="w-full rounded-md border p-2"
								placeholder="Enter building name"
							/>
						</div>
						<div>
							<label
								htmlFor="building-size"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Size (Width, Height, Depth)
							</label>
							<div className="grid grid-cols-3 gap-2">
								<input
									id="building-size-width"
									type="number"
									value={buildingSize[0]}
									onChange={(e) =>
										onBuildingSizeChange([
											Number(e.target.value),
											buildingSize[1],
											buildingSize[2],
										])
									}
									className="w-full rounded-md border p-2"
									min="0.5"
									step="0.5"
								/>
								<input
									id="building-size-height"
									type="number"
									value={buildingSize[1]}
									onChange={(e) =>
										onBuildingSizeChange([
											buildingSize[0],
											Number(e.target.value),
											buildingSize[2],
										])
									}
									className="w-full rounded-md border p-2"
									min="0.5"
									step="0.5"
								/>
								<input
									id="building-size-depth"
									type="number"
									value={buildingSize[2]}
									onChange={(e) =>
										onBuildingSizeChange([
											buildingSize[0],
											buildingSize[1],
											Number(e.target.value),
										])
									}
									className="w-full rounded-md border p-2"
									min="0.5"
									step="0.5"
								/>
							</div>
						</div>
						<div>
							<label
								htmlFor="building-color"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Color
							</label>
							<input
								id="building-color"
								type="color"
								value={buildingColor}
								onChange={(e) => onBuildingColorChange(e.target.value)}
								className="h-10 w-full rounded-md border"
							/>
						</div>
					</div>
				)}

				{/* Corridor Settings */}
				{selectedMode === "corridor" && (
					<div>
						<label
							htmlFor="corridor-width"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Corridor Width
						</label>
						<input
							id="corridor-width"
							type="number"
							value={corridorWidth}
							onChange={(e) => setCorridorWidth(Number(e.target.value))}
							className="w-full rounded-md border p-2"
							min="0.5"
							step="0.1"
						/>
					</div>
				)}

				{/* Instructions */}
				<div className="mt-4 text-gray-600 text-sm">
					{selectedMode === "place" && (
						<p>Click on the grid to place a building</p>
					)}
					{selectedMode === "remove" && <p>Click on a building to remove it</p>}
					{selectedMode === "corridor" && (
						<p>Click and drag to draw a corridor</p>
					)}
				</div>
			</div>
		</div>
	);
}
