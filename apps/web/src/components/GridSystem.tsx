import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Vector3 } from "three";
import type { Group } from "three";

interface GridSystemProps {
	gridSize: number;
	cellSize: number;
	onCellClick: (x: number, y: number) => void;
	locked?: boolean;
	/**
	 * Called with the world coordinates of the hovered cell, or null if not hovering any cell.
	 */
	onCellHover?: (coords: { x: number; y: number; z: number } | null) => void;
}

export function GridSystem({
	gridSize,
	cellSize,
	onCellClick,
	onCellHover,
}: GridSystemProps) {
	const gridRef = useRef<Group>(null);
	const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

	// Calculate grid lines
	const gridLines: Vector3[][] = [];
	const halfSize = (gridSize * cellSize) / 2;

	// Horizontal lines
	for (let i = 0; i <= gridSize; i++) {
		const y = i * cellSize - halfSize;
		gridLines.push([new Vector3(-halfSize, 0, y), new Vector3(halfSize, 0, y)]);
	}

	// Vertical lines
	for (let i = 0; i <= gridSize; i++) {
		const x = i * cellSize - halfSize;
		gridLines.push([new Vector3(x, 0, -halfSize), new Vector3(x, 0, halfSize)]);
	}

	const handleClick = (event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();

		// Get click position in world coordinates
		const point = event.point;

		// Convert to grid coordinates
		const gridX = Math.round((point.x + halfSize) / cellSize);
		const gridY = Math.round((point.z + halfSize) / cellSize);

		// Check if within grid bounds
		if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
			onCellClick(gridX, gridY);
		}
	};

	const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
		event.stopPropagation();

		// Get pointer position in world coordinates
		const point = event.point;

		// Convert to grid coordinates
		const gridX = Math.round((point.x + halfSize) / cellSize);
		const gridY = Math.round((point.z + halfSize) / cellSize);

		// Check if within grid bounds
		if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
			setHoveredCell([gridX, gridY]);
			if (onCellHover) {
				// Calculate world coordinates of cell center
				const x = gridX * cellSize - halfSize + cellSize / 2;
				const y = 0;
				const z = gridY * cellSize - halfSize + cellSize / 2;
				onCellHover({ x, y, z });
			}
		} else {
			setHoveredCell(null);
			if (onCellHover) onCellHover(null);
		}
	};

	const handlePointerOut = () => {
		setHoveredCell(null);
		if (onCellHover) onCellHover(null);
	};

	return (
		<group ref={gridRef}>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, 0]}
				onClick={handleClick}
				// onPointerMove={handlePointerMove}
				onPointerOut={handlePointerOut}
			>
				<planeGeometry args={[gridSize * cellSize, gridSize * cellSize]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>

			{hoveredCell && (
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					position={[
						hoveredCell[0] * cellSize - halfSize + cellSize / 2,
						0.02,
						hoveredCell[1] * cellSize - halfSize + cellSize / 2,
					]}
				>
					<planeGeometry args={[cellSize * 0.95, cellSize * 0.95]} />
					<meshBasicMaterial color="#4f46e5" transparent opacity={0.3} />
				</mesh>
			)}

			{gridLines.map((line, i) => {
				const isHorizontal = i <= gridSize;
				const lineIndex = isHorizontal ? i : i - (gridSize + 1);
				return (
					<Line
						key={`${isHorizontal ? "h" : "v"}-${lineIndex}`}
						points={line}
						color="#471396"
						lineWidth={1}
						opacity={0.5}
					/>
				);
			})}
		</group>
	);
}
