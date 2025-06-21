import type { Building } from "@/data/building";
import { getBuildingModelPath } from "@/utils/buildingModels";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { Material, Vector3 } from "three";
import { Mesh } from "three";

interface BuildingModelProps {
	building: Building;
	position: Vector3;
	scale: Vector3;
	onClick?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOver?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOut?: (e: ThreeEvent<MouseEvent>) => void;
	color?: string;
	opacity?: number;
	hasRooms?: boolean;
	isHighlighted?: boolean;
	isSelected?: boolean;
	isHovered?: boolean;
	rotation?: [number, number, number];
	borderColor?: string;
}

export const BuildingModel = memo(function BuildingModel({
	building,
	position,
	scale,
	onClick,
	onPointerOver,
	onPointerOut,
	color,
	opacity = 1,
	hasRooms = false,
	isHighlighted = false,
	isSelected = false,
	isHovered = false,
	rotation,
	borderColor,
}: BuildingModelProps) {
	// Use the building's custom model path or default to the standard building model
	const modelPath = getBuildingModelPath(building);
	const { scene } = useGLTF(modelPath);
	const buildingRef = useRef<Mesh>(null);
	const clonedMaterialsRef = useRef<Material[]>([]);

	const clonedScene = useMemo(() => {
		if (!scene) return null;
		return scene.clone();
	}, [scene]);

	// Apply material overrides only when necessary
	useEffect(() => {
		if (!clonedScene) return;

		// Clean up previous cloned materials
		for (const mat of clonedMaterialsRef.current) {
			if (mat.dispose) {
				mat.dispose();
			}
		}
		clonedMaterialsRef.current = [];

		// Always apply overrides if we have any changes (color, opacity, or hasRooms)
		const shouldOverride = color || opacity !== 1 || hasRooms;

		if (shouldOverride) {
			clonedScene.traverse((child) => {
				if (child instanceof Mesh && child.material) {
					if (Array.isArray(child.material)) {
						for (let i = 0; i < child.material.length; i++) {
							const mat = child.material[i];
							// Clone the material to avoid affecting other instances
							const clonedMat = mat.clone();
							clonedMaterialsRef.current.push(clonedMat);

							// Only override color if explicitly provided
							if (color && clonedMat.color) {
								clonedMat.color.set(color);
							}

							// Always set transparency if opacity is not 1
							if (opacity !== 1) {
								clonedMat.transparent = true;
								clonedMat.opacity = opacity;
								clonedMat.depthWrite = false;
							}

							// Apply room-specific settings
							if (hasRooms) {
								clonedMat.depthWrite = false;
								clonedMat.side = 2; // DoubleSide
							}

							// Ensure proper material properties
							if (clonedMat.metalness !== undefined) {
								clonedMat.metalness = 0.1;
							}
							if (clonedMat.roughness !== undefined) {
								clonedMat.roughness = 0.5;
							}

							// Replace the material in the array
							child.material[i] = clonedMat;
						}
					} else if (child.material) {
						// Clone the material to avoid affecting other instances
						const clonedMat = child.material.clone();
						clonedMaterialsRef.current.push(clonedMat);

						// Only override color if explicitly provided
						if (color && clonedMat.color) {
							clonedMat.color.set(color);
						}

						// Always set transparency if opacity is not 1
						if (opacity !== 1) {
							clonedMat.transparent = true;
							clonedMat.opacity = opacity;
							// Ensure depthWrite is false for transparent materials
							clonedMat.depthWrite = false;
						}

						// Apply room-specific settings
						if (hasRooms) {
							clonedMat.depthWrite = false;
							clonedMat.side = 2; // DoubleSide
						}

						// Ensure proper material properties for standard materials
						if (clonedMat.metalness !== undefined) {
							clonedMat.metalness = 0.1;
						}
						if (clonedMat.roughness !== undefined) {
							clonedMat.roughness = 0.5;
						}

						// Replace the material
						child.material = clonedMat;
					}
				}
			});
		}

		// Cleanup function
		return () => {
			for (const mat of clonedMaterialsRef.current) {
				if (mat.dispose) {
					mat.dispose();
				}
			}
			clonedMaterialsRef.current = [];
		};
	}, [clonedScene, color, opacity, hasRooms]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === "Enter" || e.key === " ") && onClick) {
				// Prevent default behavior and trigger click
				e.preventDefault();
			}
		},
		[onClick],
	);

	// Memoize the enabled state for Select component to prevent unnecessary re-renders
	const isSelectEnabled = useMemo(
		() => isHovered || isSelected,
		[isHovered, isSelected],
	);

	// Don't render if scene is not loaded
	if (!clonedScene) {
		// Fallback to simple box geometry if GLB model fails to load
		return (
			<group>
				<Select enabled={isSelectEnabled}>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<mesh
						position={position}
						scale={scale}
						rotation={rotation}
						onClick={onClick}
						onPointerOver={onPointerOver}
						onPointerOut={onPointerOut}
					>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color={color || "#8B7355"}
							transparent={true}
							opacity={opacity}
							metalness={0.1}
							roughness={0.5}
						/>
					</mesh>
				</Select>

				{/* Border wireframe */}
				{borderColor && (
					<mesh position={position} scale={scale} rotation={rotation}>
						<boxGeometry args={[1, 1, 1]} />
						<meshBasicMaterial
							color={borderColor}
							wireframe={true}
							transparent={true}
							opacity={0.8}
						/>
					</mesh>
				)}

				{/* Highlighted material overlay */}
				{isHighlighted && (
					<mesh position={position} scale={scale} rotation={rotation}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color="#f59e42"
							roughness={0.3}
							transparent={true}
							opacity={0.8}
						/>
					</mesh>
				)}
			</group>
		);
	}

	return (
		<group>
			<Select enabled={isSelectEnabled}>
				<primitive
					ref={buildingRef}
					object={clonedScene}
					position={position}
					scale={scale}
					rotation={rotation}
					onClick={onClick}
					onKeyDown={handleKeyDown}
					onPointerOver={onPointerOver}
					onPointerOut={onPointerOut}
					tabIndex={onClick ? 0 : undefined}
				/>
			</Select>

			{/* Border wireframe */}
			{borderColor && (
				<mesh position={position} scale={scale} rotation={rotation}>
					<boxGeometry args={[1, 1, 1]} />
					<meshBasicMaterial
						color={borderColor}
						wireframe={true}
						transparent={true}
						opacity={0.8}
					/>
				</mesh>
			)}

			{/* Highlighted material overlay */}
			{isHighlighted && (
				<primitive
					object={clonedScene.clone()}
					position={position}
					scale={scale}
					rotation={rotation}
				>
					<meshStandardMaterial
						color="#f59e42"
						metalness={0.3}
						roughness={0.3}
						transparent={true}
						opacity={0.8}
					/>
				</primitive>
			)}
		</group>
	);
});
