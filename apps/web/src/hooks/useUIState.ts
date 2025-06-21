import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { useCallback, useState } from "react";

export function useUIState() {
	const [showBuildings, setShowBuildings] = useState(true);
	const [showRooms, setShowRooms] = useState(true);
	const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
	const [pathCorridorIds, setPathCorridorIds] = useState<string[]>([]);
	const [directions, setDirections] = useState<string[]>([]);
	const [hoveredCellCoords, setHoveredCellCoords] = useState<
		[number, number] | null
	>(null);
	const [mousePos, setMousePos] = useState<[number, number] | null>(null);
	const [roomDialogOpen, setRoomDialogOpen] = useState(false);
	const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
	const [locationDialogOpen, setLocationDialogOpen] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState<
		Building | Room | null
	>(null);
	const [destinationSelectorExpanded, setDestinationSelectorExpanded] =
		useState(false);
	const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
		0, 0, 0,
	]);
	const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
		null,
	);
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [selectedBuildingForRoom, setSelectedBuildingForRoom] = useState<
		string | null
	>(null);

	const resetUI = useCallback(() => {
		setSelectedBuildings([]);
		setPathCorridorIds([]);
		setDirections([]);
		setDestinationSelectorExpanded(false);
		setLocationDialogOpen(false);
		setSelectedLocation(null);
		setSelectedBuildingId(null);
		setSelectedRoomId(null);
	}, []);

	const clearPath = useCallback(() => {
		setSelectedBuildings([]);
		setPathCorridorIds([]);
		setDirections([]);
	}, []);

	return {
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,
		selectedBuildings,
		setSelectedBuildings,
		pathCorridorIds,
		setPathCorridorIds,
		directions,
		setDirections,
		hoveredCellCoords,
		setHoveredCellCoords,
		mousePos,
		setMousePos,
		roomDialogOpen,
		setRoomDialogOpen,
		selectedRoom,
		setSelectedRoom,
		locationDialogOpen,
		setLocationDialogOpen,
		selectedLocation,
		setSelectedLocation,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		cameraTarget,
		setCameraTarget,
		selectedBuildingId,
		setSelectedBuildingId,
		selectedRoomId,
		setSelectedRoomId,
		selectedBuildingForRoom,
		setSelectedBuildingForRoom,
		resetUI,
		clearPath,
	};
}
