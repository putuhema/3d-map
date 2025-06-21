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
			// Don't automatically open dialog when selecting destination
			// The dialog should only open when clicking on locations, not when selecting them as destinations
			// This prevents the freezing issue when selecting destinations
		},
		[],
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
