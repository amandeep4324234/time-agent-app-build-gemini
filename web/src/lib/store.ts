import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Category, Entitlement } from "./types";
import { createFreeEntitlement, isDevEntitlement } from "./entitlement";
import { BlockState, createInitialBlockState } from "./block";
import { SEED_WORK, SEED_KILLERS } from "./classify";

export interface SettingsSlice {
  deathFloor: number;
  onboarded: boolean;
  focusGoalHours: number | null;
  sinkAllowanceHours: number | null;
}

export interface SeedPinsSlice {
  work: string[];
  killers: string[];
}

export interface AppState {
  settings: SettingsSlice;
  seedPins: SeedPinsSlice;
  overrides: Record<string, Category>;
  entitlement: Entitlement;
  block: BlockState;
  
  // Actions
  setDeathFloor: (floor: number) => void;
  setOnboarded: (onboarded: boolean) => void;
  setGoals: (focusGoalHours: number | null, sinkAllowanceHours: number | null) => void;
  setSeedPins: (pins: SeedPinsSlice) => void;
  setOverride: (label: string, category: Category) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  setBlockState: (block: BlockState) => void;
  resetLedger: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        deathFloor: 5,
        onboarded: false,
        focusGoalHours: null,
        sinkAllowanceHours: null,
      },
      seedPins: {
        work: [...SEED_WORK],
        killers: [...SEED_KILLERS],
      },
      overrides: {},
      entitlement: createFreeEntitlement(),
      block: createInitialBlockState(5),

      setDeathFloor: (floor) =>
        set((state) => ({
          settings: { ...state.settings, deathFloor: floor },
          block: { ...state.block, deathFloorSeconds: floor },
        })),

      setOnboarded: (onboarded) =>
        set((state) => ({
          settings: { ...state.settings, onboarded },
        })),

      setGoals: (focusGoalHours, sinkAllowanceHours) =>
        set((state) => ({
          settings: { ...state.settings, focusGoalHours, sinkAllowanceHours },
        })),

      setSeedPins: (seedPins) =>
        set(() => ({
          seedPins,
        })),

      setOverride: (label, category) =>
        set((state) => ({
          overrides: { ...state.overrides, [label]: category },
        })),

      setEntitlement: (entitlement) =>
        set(() => ({
          entitlement,
        })),

      setBlockState: (block) =>
        set(() => ({
          block,
        })),

      resetLedger: () =>
        set(() => ({
          overrides: {},
          block: createInitialBlockState(5),
        })),
    }),
    {
      name: "tf_app_store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Security guard: Any dev entitlement persisted in local storage is wiped in production
        if (process.env.NODE_ENV === "production" && isDevEntitlement(state.entitlement)) {
          state.setEntitlement(createFreeEntitlement());
        }
      },
    }
  )
);
