import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Room } from "@/data/room";

interface RoomDialogProps {
	room: Room | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onClose?: () => void;
}

export function RoomDialog({
	room,
	open,
	onOpenChange,
	onClose,
}: RoomDialogProps) {
	if (!room) return null;

	console.log(room);

	const handleOpenChange = (newOpen: boolean) => {
		onOpenChange(newOpen);
		// If the dialog is closing and we have an onClose callback, call it
		if (!newOpen && onClose) {
			onClose();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold text-xl">
						{room.name || "Unnamed Room"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{room.image && (
						<div className="relative aspect-video w-full overflow-hidden rounded-lg border">
							<img
								src={room.image}
								alt={room.name || "Room"}
								className="h-full w-full object-contain"
								onError={(e) => {
									// Hide image on error
									e.currentTarget.style.display = "none";
								}}
							/>
						</div>
					)}
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="font-medium text-muted-foreground">
								Position:
							</span>
							<span className="text-sm">
								({room.position[0]}, {room.position[1]}, {room.position[2]})
							</span>
						</div>
						<div className="flex justify-between">
							<span className="font-medium text-muted-foreground">Size:</span>
							<span className="text-sm">
								{room.size[0]} × {room.size[1]} × {room.size[2]}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="font-medium text-muted-foreground">Color:</span>
							<div className="flex items-center gap-2">
								<div
									className="h-4 w-4 rounded border"
									style={{ backgroundColor: room.color }}
								/>
								<span className="text-sm">{room.color}</span>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
