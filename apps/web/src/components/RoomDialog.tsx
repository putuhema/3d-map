import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface LocationDialogProps {
	location: Room | Building | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onClose?: () => void;
}

interface ZoomableImageProps {
	src: string;
	alt: string;
}

function ZoomableImage({ src, alt }: ZoomableImageProps) {
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const imageRef = useRef<HTMLImageElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const minScale = 0.5;
	const maxScale = 3;

	const zoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev * 1.2, maxScale));
	}, []);

	const zoomOut = useCallback(() => {
		setScale((prev) => Math.max(prev / 1.2, minScale));
	}, []);

	const resetZoom = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Handle mouse wheel zoom with proper event listener
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const delta = e.deltaY > 0 ? 0.9 : 1.1;
			setScale((prev) => {
				const newScale = prev * delta;
				return Math.max(minScale, Math.min(newScale, maxScale));
			});
		};

		container.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			container.removeEventListener("wheel", handleWheel);
		};
	}, []);

	// Handle mouse drag
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (scale > 1) {
				setIsDragging(true);
				setDragStart({
					x: e.clientX - position.x,
					y: e.clientY - position.y,
				});
			}
		},
		[scale, position],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isDragging && scale > 1) {
				setPosition({
					x: e.clientX - dragStart.x,
					y: e.clientY - dragStart.y,
				});
			}
		},
		[isDragging, dragStart, scale],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Handle touch events for mobile
	const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 });

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2) {
				// Pinch to zoom
				const distance = Math.hypot(
					e.touches[0].clientX - e.touches[1].clientX,
					e.touches[0].clientY - e.touches[1].clientY,
				);
				setTouchStart({ x: 0, y: 0, distance });
			} else if (e.touches.length === 1 && scale > 1) {
				// Single touch drag
				setIsDragging(true);
				setDragStart({
					x: e.touches[0].clientX - position.x,
					y: e.touches[0].clientY - position.y,
				});
			}
		},
		[scale, position],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			e.preventDefault();

			if (e.touches.length === 2) {
				// Pinch to zoom
				const distance = Math.hypot(
					e.touches[0].clientX - e.touches[1].clientX,
					e.touches[0].clientY - e.touches[1].clientY,
				);
				const scaleChange = distance / touchStart.distance;
				setScale((prev) => {
					const newScale = prev * scaleChange;
					return Math.max(minScale, Math.min(newScale, maxScale));
				});
				setTouchStart((prev) => ({ ...prev, distance }));
			} else if (e.touches.length === 1 && isDragging && scale > 1) {
				// Single touch drag
				setPosition({
					x: e.touches[0].clientX - dragStart.x,
					y: e.touches[0].clientY - dragStart.y,
				});
			}
		},
		[touchStart, isDragging, dragStart, scale],
	);

	const handleTouchEnd = useCallback(() => {
		setIsDragging(false);
		setTouchStart({ x: 0, y: 0, distance: 0 });
	}, []);

	// Reset zoom when dialog opens
	useEffect(() => {
		resetZoom();
	}, [resetZoom]);

	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
			<div
				ref={containerRef}
				className="relative h-full w-full overflow-hidden"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				style={{
					cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
				}}
			>
				<img
					ref={imageRef}
					src={src}
					alt={alt}
					className="h-full w-full object-contain transition-transform duration-200"
					style={{
						transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
						transformOrigin: "center",
					}}
					onError={(e) => {
						// Hide image on error
						e.currentTarget.style.display = "none";
					}}
					draggable={false}
				/>
			</div>

			{/* Zoom Controls */}
			<div className="absolute right-2 bottom-2 flex gap-1">
				<Button
					size="sm"
					variant="secondary"
					onClick={zoomOut}
					disabled={scale <= minScale}
					className="h-8 w-8 p-0"
				>
					<ZoomOut className="h-4 w-4" />
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={zoomIn}
					disabled={scale >= maxScale}
					className="h-8 w-8 p-0"
				>
					<ZoomIn className="h-4 w-4" />
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={resetZoom}
					disabled={scale === 1 && position.x === 0 && position.y === 0}
					className="h-8 w-8 p-0"
				>
					<RotateCcw className="h-4 w-4" />
				</Button>
			</div>

			{/* Zoom Level Indicator */}
			{scale !== 1 && (
				<div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-white text-xs">
					{Math.round(scale * 100)}%
				</div>
			)}
		</div>
	);
}

export function LocationDialog({
	location,
	open,
	onOpenChange,
	onClose,
}: LocationDialogProps) {
	if (!location) return null;

	const handleOpenChange = (newOpen: boolean) => {
		onOpenChange(newOpen);
		// If the dialog is closing and we have an onClose callback, call it
		if (!newOpen && onClose) {
			onClose();
		}
	};

	// Check if location is a room (has buildingId property)
	const isRoom = "buildingId" in location;
	const locationType = isRoom ? "Room" : "Building";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold text-xl">
						{location.name || `Unnamed ${locationType}`}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{isRoom && (location as Room).image && (
						<ZoomableImage
							src={(location as Room).image}
							alt={location.name || locationType}
						/>
					)}
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="font-medium text-muted-foreground">
								Position:
							</span>
							<span className="text-sm">
								({location.position[0]}, {location.position[1]},{" "}
								{location.position[2]})
							</span>
						</div>
						<div className="flex justify-between">
							<span className="font-medium text-muted-foreground">Size:</span>
							<span className="text-sm">
								{location.size[0]} × {location.size[1]} × {location.size[2]}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="font-medium text-muted-foreground">Color:</span>
							<div className="flex items-center gap-2">
								<div
									className="h-4 w-4 rounded border"
									style={{ backgroundColor: location.color }}
								/>
								<span className="text-sm">{location.color}</span>
							</div>
						</div>
						{isRoom && (location as Building).hasRooms !== undefined && (
							<div className="flex justify-between">
								<span className="font-medium text-muted-foreground">Type:</span>
								<span className="text-sm">{locationType}</span>
							</div>
						)}
						{!isRoom && (location as Building).hasRooms !== undefined && (
							<div className="flex justify-between">
								<span className="font-medium text-muted-foreground">
									Has Rooms:
								</span>
								<span className="text-sm">
									{(location as Building).hasRooms ? "Yes" : "No"}
								</span>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
