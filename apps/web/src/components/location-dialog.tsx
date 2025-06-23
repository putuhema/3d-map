import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { useHospitalMapStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export function LocationDialog() {
	const { getRoomById, getBuildingById } = useHospitalMapStore();
	const { handleFindPath } = useHospitalMap();
	const { dialog, toId, fromId, type } = useSearch({ strict: false });
	const navigate = useNavigate({ from: "/" });

	const id = toId || dialog;
	const location = useMemo(() => {
		if (!id) return null;

		if (type === "room") {
			return getRoomById(id);
		}
		if (type === "building") {
			return getBuildingById(id);
		}
		return null;
	}, [id, type, getRoomById, getBuildingById]);

	if (!location) return null;

	return (
		<Dialog
			open={!!id}
			onOpenChange={(newOpen) => {
				navigate({
					search: {
						dialog: newOpen ? id : undefined,
						type: undefined,
					},
				});
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-semibold text-xl">
						{location.name}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-2">
					{location.image && (
						<ZoomableImage src={location.image} alt={location.name} />
					)}
					{location.name.toLowerCase().startsWith("poli") && (
						<div>
							<p className="text-center font-bold">Jam Operasional</p>
							<div className="grid grid-cols-3 gap-2">
								<span>Hari</span>
								<span>Jam Pertama</span>
								<span>Jam Kedua</span>
							</div>
							<div className="grid grid-cols-3 gap-2">
								<span className="font-medium text-muted-foreground text-sm">
									Senin, Selasa, Rabu, Kamis
								</span>
								<span>08:00 - 12:00</span>
								<span>14:00 - 16:00</span>
							</div>
							<div className="grid grid-cols-3 gap-2">
								<span className="font-medium text-muted-foreground text-sm">
									Jumat
								</span>
								<span>08:00 - 12:00</span>
								<span>14:00 - 16:30</span>
							</div>
						</div>
					)}
				</div>
				{handleFindPath && fromId && toId && (
					<DialogFooter>
						<Button variant="outline" onClick={handleFindPath}>
							Cari Rute
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
