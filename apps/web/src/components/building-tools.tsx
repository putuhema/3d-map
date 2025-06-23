import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import { useHospitalMapStore } from "@/lib/store";
import { useState } from "react";

type ToolMode = "place" | "remove" | "corridor" | "room";

function Minimap({
	buildings,
	corridors,
	selectedMode,
	onCorridorRemove,
	gridSize,
	cellSize,
}: {
	buildings: Building[];
	corridors: Corridor[];
	selectedMode: ToolMode;
	onCorridorRemove: (id: string) => void;
	gridSize: number;
	cellSize: number;
}) {
	// Calculate minimap size to cover the grid
	const minimapSize = 120; // px (container size)
	const gridWorldSize = gridSize * cellSize;
	const baseScale = minimapSize / gridWorldSize;
	const offset = minimapSize / 2;

	// --- Zoom and Pan State ---
	const [zoom, setZoom] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);
	const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

	const handleZoomIn = () => setZoom((z) => Math.min(z * 1.25, 10));
	const handleZoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.2));
	const handleReset = () => {
		setZoom(1);
		setPan({ x: 0, y: 0 });
	};

	const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
		setDragging(true);
		setLastPos({ x: e.clientX, y: e.clientY });
	};
	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
		if (!dragging || !lastPos) return;
		const dx = e.clientX - lastPos.x;
		const dy = e.clientY - lastPos.y;
		setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
		setLastPos({ x: e.clientX, y: e.clientY });
	};
	const handleMouseUp = () => {
		setDragging(false);
		setLastPos(null);
	};
	const handleMouseLeave = () => {
		setDragging(false);
		setLastPos(null);
	};

	// --- Transform for zoom and pan ---
	const transform = `translate(${pan.x},${pan.y}) scale(${zoom})`;

	return (
		<div className="mb-4">
			<div className="mb-1 flex justify-end gap-1">
				<button
					type="button"
					className="rounded border bg-white px-2 py-0.5 text-xs hover:bg-gray-100"
					onClick={handleZoomIn}
					title="Zoom in"
				>
					+
				</button>
				<button
					type="button"
					className="rounded border bg-white px-2 py-0.5 text-xs hover:bg-gray-100"
					onClick={handleZoomOut}
					title="Zoom out"
				>
					-
				</button>
				<button
					type="button"
					className="rounded border bg-white px-2 py-0.5 text-xs hover:bg-gray-100"
					onClick={handleReset}
					title="Reset view"
				>
					⟳
				</button>
			</div>
			<svg
				width={minimapSize}
				height={minimapSize}
				className="cursor-grab rounded border bg-gray-50"
				style={{ display: "block" }}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
			>
				<title>Minimap of buildings and corridors</title>
				{/* Draw grid border */}
				<rect
					x={0}
					y={0}
					width={minimapSize}
					height={minimapSize}
					fill="none"
					stroke="#e5e7eb"
					strokeWidth={1}
				/>
				<g transform={transform}>
					{/* Grid lines */}
					{Array.from({ length: gridSize + 1 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<g key={i}>
							{/* Vertical lines */}
							<line
								x1={i * (minimapSize / gridSize)}
								y1={0}
								x2={i * (minimapSize / gridSize)}
								y2={minimapSize}
								stroke="#e5e7eb"
								strokeWidth={0.5}
							/>
							{/* Horizontal lines */}
							<line
								x1={0}
								y1={i * (minimapSize / gridSize)}
								x2={minimapSize}
								y2={i * (minimapSize / gridSize)}
								stroke="#e5e7eb"
								strokeWidth={0.5}
							/>
						</g>
					))}
					{/* Corridors */}
					{corridors.map((c) => (
						<line
							key={c.id}
							x1={offset + c.start[0] * baseScale}
							y1={offset - c.start[2] * baseScale}
							x2={offset + c.end[0] * baseScale}
							y2={offset - c.end[2] * baseScale}
							stroke="#a3a3a3"
							strokeWidth={c.width * baseScale * 0.5}
							strokeLinecap="round"
							opacity={0.7}
							style={{
								cursor: selectedMode === "remove" ? "pointer" : undefined,
							}}
							onClick={
								selectedMode === "remove"
									? () => onCorridorRemove(c.id)
									: undefined
							}
							tabIndex={selectedMode === "remove" ? 0 : undefined}
							onKeyDown={
								selectedMode === "remove"
									? (e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onCorridorRemove(c.id);
											}
										}
									: undefined
							}
						/>
					))}
					{/* Buildings */}
					{buildings.map((b) => (
						<rect
							key={b.id}
							x={offset + (b.position[0] - b.size[0] / 2) * baseScale}
							y={offset - (b.position[2] + b.size[2] / 2) * baseScale}
							width={b.size[0] * baseScale}
							height={b.size[2] * baseScale}
							fill={b.color}
							stroke="#333"
							strokeWidth={0.5}
							opacity={0.85}
						/>
					))}
				</g>
			</svg>
		</div>
	);
}

export function BuildingTools() {
	const {
		toolMode,
		buildingName,
		buildingSize,
		buildingColor,
		handleCorridorRemove,
		setToolMode,
		setBuildingName,
		setBuildingSize,
		setBuildingColor,
	} = useHospitalMapStore();

	const [corridorWidth, setCorridorWidth] = useState(1.2);

	const handleRemoveCorridor = (id: string) => {
		handleCorridorRemove(id);
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
							toolMode === "place"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setToolMode("place")}
					>
						Place
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							toolMode === "remove"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setToolMode("remove")}
					>
						Remove
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							toolMode === "corridor"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setToolMode("corridor")}
					>
						Corridor
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							toolMode === "room"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setToolMode("room")}
					>
						Room
					</button>
				</div>

				{(toolMode === "place" || toolMode === "room") && (
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
								onChange={(e) => setBuildingName(e.target.value)}
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
										setBuildingSize([
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
										setBuildingSize([
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
										setBuildingSize([
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
								onChange={(e) => setBuildingColor(e.target.value)}
								className="h-10 w-full rounded-md border"
							/>
						</div>
					</div>
				)}

				{toolMode === "corridor" && (
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
					{toolMode === "place" && <p>Click on the grid to place a building</p>}
					{toolMode === "remove" && (
						<p>Click on a building or corridor to remove it</p>
					)}
					{toolMode === "corridor" && <p>Click and drag to draw a corridor</p>}
				</div>
			</div>
		</div>
	);
}
