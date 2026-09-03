export type BlockStatus = "idle" | "active" | "completed" | "broken" | "cancelled";

export interface BlockState {
  blockId: string | null;
  status: BlockStatus;
  startedAtMs: number | null;
  targetMinutes: number | null; // 15, 25, 45, or null (open-ended)
  deathFloorSeconds: number; // 3, 5, 10
  grownMs: number;
  killerName: string | null;
  killerPrivate: boolean;
  killerOnScreenSeconds: number;
}

export function createInitialBlockState(deathFloor = 5): BlockState {
  return {
    blockId: null,
    status: "idle",
    startedAtMs: null,
    targetMinutes: 25,
    deathFloorSeconds: deathFloor,
    grownMs: 0,
    killerName: null,
    killerPrivate: false,
    killerOnScreenSeconds: 0,
  };
}

export function startBlock(
  targetMinutes: number | null = 25,
  deathFloor = 5,
  nowMs = Date.now()
): BlockState {
  return {
    blockId: `block-${nowMs}-${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    startedAtMs: nowMs,
    targetMinutes,
    deathFloorSeconds: deathFloor,
    grownMs: 0,
    killerName: null,
    killerPrivate: false,
    killerOnScreenSeconds: 0,
  };
}

export function stepBlock(
  state: BlockState,
  label: string,
  dtSeconds: number,
  category: string
): BlockState {
  if (state.status !== "active") {
    return state;
  }

  // Work session -> grows
  if (category === "work") {
    const nextGrown = state.grownMs + dtSeconds * 1000;
    // Check if target reached
    if (state.targetMinutes !== null && nextGrown >= state.targetMinutes * 60 * 1000) {
      return {
        ...state,
        status: "completed",
        grownMs: state.targetMinutes * 60 * 1000,
      };
    }
    return {
      ...state,
      grownMs: nextGrown,
      killerOnScreenSeconds: 0,
    };
  }

  // Known sink -> check death floor
  if (category === "sink") {
    const nextOnScreen = state.killerOnScreenSeconds + dtSeconds;
    if (nextOnScreen >= state.deathFloorSeconds) {
      const isPrivate = label.toLowerCase().includes("private");
      return {
        ...state,
        status: "broken",
        killerName: isPrivate ? "private" : label,
        killerPrivate: isPrivate,
        killerOnScreenSeconds: nextOnScreen,
      };
    }
    return {
      ...state,
      killerOnScreenSeconds: nextOnScreen,
    };
  }

  // Unknown, filler, games, system -> unknown NEVER kills, holds state
  return {
    ...state,
    killerOnScreenSeconds: 0,
  };
}

export function cancelBlock(state: BlockState): BlockState {
  if (state.status !== "active") return state;
  return {
    ...state,
    status: "cancelled",
  };
}
