export interface TasbeehState {
  dhikrId: string;
  target: number;
  count: number;
  cycles: number;
  total: number;
  today: number;
  day: string;
  wisdomIndex: number;
}

export const DEFAULT_TASBEEH: TasbeehState = {
  dhikrId: "subhan",
  target: 33,
  count: 0,
  cycles: 0,
  total: 0,
  today: 0,
  day: "",
  wisdomIndex: -1,
};

/** One tap on the beads. When the count reaches the target a cycle completes and resets to 0. */
export function tap(state: TasbeehState, day: string): { next: TasbeehState; completedCycle: boolean } {
  const today = state.day === day ? state.today + 1 : 1;
  const count = state.count + 1;
  const completedCycle = count >= state.target;
  return {
    completedCycle,
    next: {
      ...state,
      day,
      today,
      total: state.total + 1,
      count: completedCycle ? 0 : count,
      cycles: completedCycle ? state.cycles + 1 : state.cycles,
      wisdomIndex: completedCycle ? state.wisdomIndex + 1 : state.wisdomIndex,
    },
  };
}
