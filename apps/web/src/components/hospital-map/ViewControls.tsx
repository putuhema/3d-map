interface ViewControlsProps {
	viewMode: "topDown" | "perspective" | "walk";
	setViewMode: (mode: "topDown" | "perspective" | "walk") => void;
	showBuildings: boolean;
	setShowBuildings: (show: boolean) => void;
	editMode: boolean;
	setEditMode: (edit: boolean) => void;
	locationError: string | null;
	userLocation: { lat: number; lng: number } | null;
}

export function ViewControls({
	viewMode,
	setViewMode,
	showBuildings,
	setShowBuildings,
	editMode,
	setEditMode,
	locationError,
	userLocation,
}: ViewControlsProps) {
	return (
		<div className="absolute top-24 left-4 z-10 flex flex-col gap-2">
			<div className="rounded-md bg-white/90 p-3 shadow-md backdrop-blur-sm">
				{locationError && (
					<div className="mb-2 text-red-600 text-sm">{locationError}</div>
				)}
				{userLocation && (
					<div className="mb-2 text-emerald-600 text-sm">
						Your location: {userLocation.lat.toFixed(6)},{" "}
						{userLocation.lng.toFixed(6)}
					</div>
				)}
				<div className="mb-2 flex items-center gap-2">
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							viewMode === "topDown"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setViewMode("topDown")}
					>
						Top-Down
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							viewMode === "perspective"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setViewMode("perspective")}
					>
						3D View
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1.5 font-medium text-sm ${
							viewMode === "walk"
								? "bg-emerald-600 text-white"
								: "bg-gray-200 text-gray-700"
						}`}
						onClick={() => setViewMode("walk")}
					>
						Walk Mode
					</button>
					<label className="ml-2 flex items-center gap-1 text-sm">
						<input
							type="checkbox"
							checked={showBuildings}
							onChange={(e) => setShowBuildings(e.target.checked)}
							className="accent-emerald-600"
						/>
						Show Buildings
					</label>
					<label className="ml-2 flex items-center gap-1 text-sm">
						<input
							type="checkbox"
							checked={editMode}
							onChange={(e) => setEditMode(e.target.checked)}
							className="accent-emerald-600"
						/>
						Edit Mode
					</label>
				</div>
				{viewMode === "walk" && (
					<div className="mt-2 text-gray-600 text-xs">
						Use <span className="rounded bg-gray-100 px-1 font-mono">WASD</span>{" "}
						keys to walk around
					</div>
				)}
			</div>
		</div>
	);
}
