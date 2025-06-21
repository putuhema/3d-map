import type { Room } from "@/data/room";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import { memo, useEffect, useMemo, useRef } from "react";
import type { Material, Object3D, Vector3 } from "three";
import { Mesh } from "three";

interface RoomModelProps {
	room: Room;
	position: Vector3;
	scale: Vector3;
	onClick?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOver?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOut?: (e: ThreeEvent<MouseEvent>) => void;
	color?: string;
	opacity?: number;
	isHighlighted?: boolean;
	isSelected?: boolean;
	isHovered?: boolean;
	rotation?: [number, number, number];
}

export const RoomModel = memo(function RoomModel({
	room,
	position,
	scale,
	onClick,
	onPointerOver,
	onPointerOut,
	color,
	opacity = 1,
	isHighlighted = false,
	isSelected = false,
	isHovered = false,
	rotation,
}: RoomModelProps) {
	const shouldUseCustomModel = room.name !== "Wall";

	const gltf = useGLTF("/models/room.glb");
	const roomRef = useRef<Mesh>(null);
	const clonedMaterialsRef = useRef<Material[]>([]);

	const clonedScene = useMemo(() => {
		if (!gltf.scene || !shouldUseCustomModel) return null;
		return gltf.scene.clone();
	}, [gltf.scene, shouldUseCustomModel]);

	useEffect(() => {
		if (!clonedScene || !shouldUseCustomModel) return;

		for (const mat of clonedMaterialsRef.current) {
			if (mat.dispose) {
				mat.dispose();
			}
		}
		clonedMaterialsRef.current = [];

		const shouldOverride = color || opacity !== 1 || isHovered;

		if (shouldOverride) {
			clonedScene.traverse((child: Object3D) => {
				if (child instanceof Mesh && child.material) {
					if (Array.isArray(child.material)) {
						for (let i = 0; i < child.material.length; i++) {
							const mat = child.material[i];
							const clonedMat = mat.clone();
							clonedMaterialsRef.current.push(clonedMat);

							if (color && clonedMat.color) {
								clonedMat.color.set(color);
							}

							if (opacity !== 1) {
								clonedMat.transparent = true;
								clonedMat.opacity = opacity;
								clonedMat.depthWrite = false;
							}

							if (clonedMat.roughness !== undefined) {
								clonedMat.roughness = isHovered ? 0.3 : 0.5;
							}

							child.material[i] = clonedMat;
						}
					} else if (child.material) {
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
							clonedMat.depthWrite = false;
						}

						// Ensure proper material properties for standard materials
						if (clonedMat.roughness !== undefined) {
							clonedMat.roughness = isHovered ? 0.3 : 0.5;
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
	}, [clonedScene, color, opacity, isHovered, shouldUseCustomModel]);

	const isSelectEnabled = useMemo(
		() => isHovered || isSelected,
		[isHovered, isSelected],
	);

	if (!shouldUseCustomModel) {
		return (
			<group>
				<Select enabled={false}>
					<mesh
						ref={roomRef}
						position={position}
						scale={scale}
						renderOrder={1}
						rotation={rotation}
					>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color="#E7C293"
							transparent={true}
							opacity={opacity}
							roughness={0.5}
							depthWrite={true}
						/>
					</mesh>
				</Select>
			</group>
		);
	}

	// Don't render if scene is not loaded
	if (!clonedScene) {
		// Fallback to simple box geometry if GLB model fails to load
		return (
			<group>
				<Select enabled={isSelectEnabled}>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: mesh elements don't support keyboard events */}
					<mesh
						ref={roomRef}
						position={position}
						scale={scale}
						onPointerOver={onPointerOver}
						onClick={onClick}
						onPointerOut={onPointerOut}
						renderOrder={1}
						rotation={rotation}
					>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color="#E7C293"
							transparent={true}
							opacity={opacity}
							roughness={0.5}
							depthWrite={true}
						/>
					</mesh>
				</Select>
			</group>
		);
	}

	return (
		<group>
			<Select enabled={isSelectEnabled}>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<mesh
					ref={roomRef}
					position={[position.x, position.y - 0.5, position.z]}
					scale={scale}
					onClick={onClick}
					onPointerOver={onPointerOver}
					onPointerOut={onPointerOut}
					renderOrder={1}
					rotation={rotation}
				>
					<primitive object={clonedScene} />
				</mesh>
			</Select>

			{/* Highlighted material overlay */}
			{isHighlighted && (
				<primitive
					object={clonedScene.clone()}
					position={[position.x, position.y - 0.5, position.z]}
					scale={scale}
					rotation={rotation}
				>
					<meshStandardMaterial
						color="#f59e42"
						roughness={0.3}
						transparent={true}
						opacity={0.8}
					/>
				</primitive>
			)}
		</group>
	);
});
