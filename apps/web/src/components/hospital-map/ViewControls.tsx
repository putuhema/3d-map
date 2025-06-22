import { useHospitalMapStore } from "@/lib/store";

export function ViewControls() {
	const {
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,
		editMode,
		setEditMode,
		locationError,
	} = useHospitalMapStore();

	return (
		<div className="absolute top-24 left-4 z-10 flex flex-col gap-2">
			<div className="rounded-md bg-white/90 p-3 shadow-md backdrop-blur-sm">
				{locationError && (
					<div className="mb-2 text-red-600 text-sm">{locationError}</div>
				)}
				<div className="mb-2 flex items-center gap-2">
					<div className="flex flex-col gap-2">
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
								checked={showRooms}
								onChange={(e) => setShowRooms(e.target.checked)}
								className="accent-emerald-600"
							/>
							Show Rooms
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
				</div>
			</div>
		</div>
	);
}
