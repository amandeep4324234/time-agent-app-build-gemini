import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Category, Entitlement } from "./types";
import { createFreeEntitlement, isDevEntitlement } from "./entitlement";
import { BlockState, createInitialBlockState } from "./block";
import { SEED_WORK, SEED_KILLERS } from "./classify";
import {
  FocusBlock,
  createFocusBlock,
  pauseFocusBlock,
  resumeFocusBlock,
  finishFocusBlock,
} from "./focus-blocks";
import {
  CorrectionEvent,
  RevisionBatch,
  ClassificationRule,
} from "./corrections";
import { ReflectionTone } from "./reflection-service";

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

export const INITIAL_DEMO_BLOCKS: FocusBlock[] = [
  {
    id: "demo-block-1",
    title: "Deep work on architecture",
    tags: ["Engineering", "Architecture"],
    plannedSeconds: 2700, // 45 minutes
    activeIntervals: [
      {
        startUtc: "2026-09-02T18:10:00.000Z",
        endUtc: "2026-09-02T18:55:00.000Z",
      },
    ],
    state: "awaiting_review",
    revisionId: "rev-init-1",
    createdAtUtc: "2026-09-02T18:10:00.000Z",
    updatedAtUtc: "2026-09-02T18:55:00.000Z",
    autoReview: true,
    syncStatus: "saved_locally",
    originDeviceId: "desktop-primary",
  },
  {
    id: "demo-block-2",
    title: "Morning planning & review",
    tags: ["Planning"],
    plannedSeconds: 1500, // 25 minutes
    activeIntervals: [
      {
        startUtc: "2026-09-02T05:00:00.000Z",
        endUtc: "2026-09-02T05:25:00.000Z",
      },
    ],
    state: "reviewed",
    revisionId: "rev-init-2",
    createdAtUtc: "2026-09-02T05:00:00.000Z",
    updatedAtUtc: "2026-09-02T05:30:00.000Z",
    autoReview: true,
    syncStatus: "synced",
    originDeviceId: "desktop-primary",
  },
];

export interface AppState {
  settings: SettingsSlice;
  seedPins: SeedPinsSlice;
  overrides: Record<string, Category>;
  entitlement: Entitlement;
  block: BlockState;

  // Focus Blocks State (§7)
  focusBlocks: FocusBlock[];
  activeBlockId: string | null;

  // Post-Sync Corrections & Revision State (§8, §9)
  correctionBatches: RevisionBatch[];
  classificationRules: ClassificationRule[];
  currentRevisionId: string;

  // AI Reflection Settings (§4.1)
  aiTone: ReflectionTone;
  aiEnabled: boolean;
  aiDismissedDays: Record<string, boolean>;

  // Actions
  setDeathFloor: (floor: number) => void;
  setOnboarded: (onboarded: boolean) => void;
  setGoals: (focusGoalHours: number | null, sinkAllowanceHours: number | null) => void;
  setSeedPins: (pins: SeedPinsSlice) => void;
  setOverride: (label: string, category: Category) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  setBlockState: (block: BlockState) => void;
  resetLedger: () => void;

  // Focus Block Actions
  startFocusBlock: (title: string, plannedMinutes: number | null, tags: string[], autoReview?: boolean) => FocusBlock;
  pauseCurrentBlock: () => void;
  resumeCurrentBlock: () => void;
  finishCurrentBlock: () => FocusBlock | null;
  updateFocusBlock: (id: string, updates: Partial<FocusBlock>) => void;

  // Correction & Review Actions (§8, §9)
  commitReviewBatch: (blockId: string, operations: CorrectionEvent[], batchSummary?: string) => void;
  undoRevisionBatch: (batchId: string) => void;
  addClassificationRule: (rule: ClassificationRule) => void;

  // AI Settings Actions
  setAiTone: (tone: ReflectionTone) => void;
  setAiEnabled: (enabled: boolean) => void;
  dismissAiDay: (day: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: {
        deathFloor: 5,
        onboarded: false,
        focusGoalHours: 4, // default 4h
        sinkAllowanceHours: 1.5,
      },
      seedPins: {
        work: [...SEED_WORK],
        killers: [...SEED_KILLERS],
      },
      overrides: {},
      entitlement: createFreeEntitlement(),
      block: createInitialBlockState(5),

      // Midnight Studio Focus Blocks & Corrections
      focusBlocks: INITIAL_DEMO_BLOCKS,
      activeBlockId: null,
      correctionBatches: [],
      classificationRules: [],
      currentRevisionId: "rev-init",

      // AI Observation Settings
      aiTone: "witty",
      aiEnabled: true,
      aiDismissedDays: {},

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
          currentRevisionId: `rev-ov-${Date.now()}`,
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
          focusBlocks: INITIAL_DEMO_BLOCKS,
          activeBlockId: null,
          correctionBatches: [],
          classificationRules: [],
          currentRevisionId: `rev-reset-${Date.now()}`,
        })),

      startFocusBlock: (title, plannedMinutes, tags, autoReview = true) => {
        const newBlock = createFocusBlock({
          title,
          plannedMinutes,
          tags,
          autoReview,
        });
        set((state) => ({
          focusBlocks: [newBlock, ...state.focusBlocks],
          activeBlockId: newBlock.id,
          currentRevisionId: newBlock.revisionId,
        }));
        return newBlock;
      },

      pauseCurrentBlock: () => {
        const { activeBlockId, focusBlocks } = get();
        if (!activeBlockId) return;
        const current = focusBlocks.find((b) => b.id === activeBlockId);
        if (!current) return;

        const updated = pauseFocusBlock(current);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) => (b.id === activeBlockId ? updated : b)),
          currentRevisionId: updated.revisionId,
        }));
      },

      resumeCurrentBlock: () => {
        const { activeBlockId, focusBlocks } = get();
        if (!activeBlockId) return;
        const current = focusBlocks.find((b) => b.id === activeBlockId);
        if (!current) return;

        const updated = resumeFocusBlock(current);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) => (b.id === activeBlockId ? updated : b)),
          currentRevisionId: updated.revisionId,
        }));
      },

      finishCurrentBlock: () => {
        const { activeBlockId, focusBlocks } = get();
        if (!activeBlockId) return null;
        const current = focusBlocks.find((b) => b.id === activeBlockId);
        if (!current) return null;

        const updated = finishFocusBlock(current);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) => (b.id === activeBlockId ? updated : b)),
          activeBlockId: null,
          currentRevisionId: updated.revisionId,
        }));
        return updated;
      },

      updateFocusBlock: (id, updates) => {
        const newRev = `rev-fb-${Date.now()}`;
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAtUtc: new Date().toISOString(), revisionId: newRev } : b
          ),
          currentRevisionId: newRev,
        }));
      },

      commitReviewBatch: (blockId, operations, batchSummary) => {
        const newRev = `rev-batch-${Date.now()}`;
        const newBatch: RevisionBatch = {
          id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          baseRevisionId: get().currentRevisionId,
          operations,
          status: "applied",
          appliedAtUtc: new Date().toISOString(),
          summary: batchSummary || `Review adjustments (${operations.length} changes)`,
        };

        set((state) => ({
          correctionBatches: [newBatch, ...state.correctionBatches],
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  state: "reviewed",
                  revisionId: newRev,
                  updatedAtUtc: new Date().toISOString(),
                  syncStatus: "saved_locally",
                }
              : b
          ),
          currentRevisionId: newRev,
        }));
      },

      undoRevisionBatch: (batchId) => {
        const targetBatch = get().correctionBatches.find((b) => b.id === batchId);
        if (!targetBatch) return;

        // Create reversal operations
        const reversalOps: CorrectionEvent[] = targetBatch.operations.map((op) => ({
          ...op,
          id: `rev-undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          operation: "restore",
          createdAtUtc: new Date().toISOString(),
        }));

        const newRev = `rev-undo-${Date.now()}`;
        const undoBatch: RevisionBatch = {
          id: `batch-undo-${Date.now()}`,
          baseRevisionId: get().currentRevisionId,
          operations: reversalOps,
          status: "applied",
          appliedAtUtc: new Date().toISOString(),
          summary: `Reversal of batch ${batchId}`,
        };

        set((state) => ({
          correctionBatches: [undoBatch, ...state.correctionBatches],
          currentRevisionId: newRev,
        }));
      },

      addClassificationRule: (rule) => {
        set((state) => ({
          classificationRules: [...state.classificationRules, rule],
          currentRevisionId: `rev-rule-${Date.now()}`,
        }));
      },

      setAiTone: (aiTone) => set(() => ({ aiTone })),
      setAiEnabled: (aiEnabled) => set(() => ({ aiEnabled })),
      dismissAiDay: (day) =>
        set((state) => ({
          aiDismissedDays: { ...state.aiDismissedDays, [day]: true },
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
        if (process.env.NODE_ENV === "production" && isDevEntitlement(state.entitlement)) {
          state.setEntitlement(createFreeEntitlement());
        }
      },
    }
  )
);
