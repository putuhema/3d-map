import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";

export interface BuildingRendererProps {
	buildings: Building[];
	corridors: Corridor[];
	rooms: Room[];
	onBuildingClick?: (id: string, roomId?: string) => void;
	onCorridorClick?: (id: string) => void;
	highlightedCorridorIds?: string[];
	highlightedBuildingIds?: string[];
	showBuildings?: boolean;
	showRooms?: boolean;
	fromId?: string | null;
	toId?: string | null;
	selectedBuildingId?: string | null;
	selectedRoomId?: string | null;
}

export interface UseBuildingRendererProps {
	buildings: Building[];
	corridors: Corridor[];
	rooms: Room[];
	highlightedCorridorIds: string[];
	fromId: string | null;
	toId: string | null;
}
