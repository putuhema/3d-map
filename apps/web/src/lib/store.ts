import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LabelState {
	showBuildingLabels: boolean;
	showRoomLabels: boolean;
	toggleBuildingLabels: () => void;
	toggleRoomLabels: () => void;
	setBuildingLabels: (show: boolean) => void;
	setRoomLabels: (show: boolean) => void;
}

interface ViewState {
	viewMode: "topDown" | "perspective" | "walk";
	cameraMode: "free" | "topDown";
	setViewMode: (mode: "topDown" | "perspective" | "walk") => void;
	setCameraMode: (mode: "free" | "topDown") => void;
}

interface TutorialState {
	hasSeenTutorial: boolean;
	showTutorial: boolean;
	setHasSeenTutorial: (seen: boolean) => void;
	setShowTutorial: (show: boolean) => void;
	dismissTutorial: () => void;
}

interface NavigationState {
	fromId: string | null;
	toId: string | null;
	setFromId: (id: string | null) => void;
	setToId: (id: string | null) => void;
	updateUrl: () => void;
	syncFromUrl: () => void;
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

export const useTutorialStore = create<TutorialState>()(
	persist(
		(set) => ({
			hasSeenTutorial: false,
			showTutorial: false,
			setHasSeenTutorial: (seen: boolean) => set({ hasSeenTutorial: seen }),
			setShowTutorial: (show: boolean) => set({ showTutorial: show }),
			dismissTutorial: () =>
				set({ showTutorial: false, hasSeenTutorial: true }),
		}),
		{
			name: "tutorial-storage",
			partialize: (state) => ({ hasSeenTutorial: state.hasSeenTutorial }),
		},
	),
);

export const useNavigationStore = create<NavigationState>((set, get) => ({
	fromId: null,
	toId: null,
	setFromId: (id: string | null) => {
		set({ fromId: id });
		get().updateUrl();
	},
	setToId: (id: string | null) => {
		set({ toId: id });
		get().updateUrl();
	},
	updateUrl: () => {
		const { fromId, toId } = get();
		const url = new URL(window.location.href);

		if (fromId) {
			url.searchParams.set("from", fromId);
		} else {
			url.searchParams.delete("from");
		}

		if (toId) {
			url.searchParams.set("to", toId);
		} else {
			url.searchParams.delete("to");
		}

		window.history.replaceState({}, "", url.toString());
	},
	syncFromUrl: () => {
		const url = new URL(window.location.href);
		const fromId = url.searchParams.get("from");
		const toId = url.searchParams.get("to");

		set({ fromId, toId });
	},
}));
