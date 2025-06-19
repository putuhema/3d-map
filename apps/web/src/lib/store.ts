import { create } from "zustand";

interface LabelState {
	showBuildingLabels: boolean;
	showRoomLabels: boolean;
	toggleBuildingLabels: () => void;
	toggleRoomLabels: () => void;
	setBuildingLabels: (show: boolean) => void;
	setRoomLabels: (show: boolean) => void;
}

interface ViewState {
	viewMode: "topDown" | "perspective";
	cameraMode: "free" | "topDown";
	setViewMode: (mode: "topDown" | "perspective") => void;
	setCameraMode: (mode: "free" | "topDown") => void;
}

export const useLabelStore = create<LabelState>((set) => ({
	showBuildingLabels: false,
	showRoomLabels: false,
	toggleBuildingLabels: () =>
		set((state) => ({ showBuildingLabels: !state.showBuildingLabels })),
	toggleRoomLabels: () =>
		set((state) => ({ showRoomLabels: !state.showRoomLabels })),
	setBuildingLabels: (show: boolean) => set({ showBuildingLabels: show }),
	setRoomLabels: (show: boolean) => set({ showRoomLabels: show }),
}));

export const useViewStore = create<ViewState>((set) => ({
	viewMode: "perspective",
	cameraMode: "free",
	setViewMode: (mode) => set({ viewMode: mode }),
	setCameraMode: (mode) => set({ cameraMode: mode }),
}));
