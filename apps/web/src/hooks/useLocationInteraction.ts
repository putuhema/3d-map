import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { useCallback } from "react";

interface UseLocationInteractionProps {
	getRoomById: (id: string) => Room | undefined;
	getBuildingById: (id: string) => Building | undefined;
	setSelectedLocation: (location: Building | Room | null) => void;
	setLocationDialogOpen: (open: boolean) => void;
	setSelectedBuildingId: (id: string | null) => void;
	setSelectedRoomId: (id: string | null) => void;
	setDestinationSelectorExpanded: (expanded: boolean) => void;
	clearPath: () => void;
}

export function useLocationInteraction({
	getRoomById,
	getBuildingById,
	setSelectedLocation,
	setLocationDialogOpen,
	setSelectedBuildingId,
	setSelectedRoomId,
	setDestinationSelectorExpanded,
	clearPath,
}: UseLocationInteractionProps) {
	const handleToSelect = useCallback(
		(id: string, type: "building" | "room" | "corridor") => {
			clearPath();

			// Show location dialog for rooms and buildings
			if (type === "room") {
				const room = getRoomById(id);
				if (room) {
					setSelectedLocation(room);
					setLocationDialogOpen(true);
				}
			} else if (type === "building") {
				const building = getBuildingById(id);
				if (building) {
					setSelectedLocation(building);
					setLocationDialogOpen(true);
				}
			}
			// For corridors, we don't show a dialog since they're just path points
		},
		[
			getRoomById,
			getBuildingById,
			setSelectedLocation,
			setLocationDialogOpen,
			clearPath,
		],
	);

	const handleLocationClick = useCallback(
		(id: string, roomId?: string) => {
			if (roomId) {
				// Clicked on a room
				const room = getRoomById(roomId);
				if (room) {
					setSelectedLocation(room);
					setLocationDialogOpen(true);
					setSelectedRoomId(roomId);
					setSelectedBuildingId(null); // Clear building selection
				}
			} else {
				// Clicked on a building
				const building = getBuildingById(id);
				if (building) {
					setSelectedLocation(building);
					setLocationDialogOpen(true);
					setSelectedBuildingId(id);
					setSelectedRoomId(null); // Clear room selection
				}
			}
		},
		[
			getRoomById,
			getBuildingById,
			setSelectedLocation,
			setLocationDialogOpen,
			setSelectedRoomId,
			setSelectedBuildingId,
		],
	);

	const handleRoomDialogClose = useCallback(() => {
		// Close the destination selector
		setDestinationSelectorExpanded(false);
	}, [setDestinationSelectorExpanded]);

	return {
		handleToSelect,
		handleLocationClick,
		handleRoomDialogClose,
	};
}
