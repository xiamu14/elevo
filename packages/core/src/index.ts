import type {
  Machine,
  StateDefinition,
  XStateConfig,
  MachineSchema,
  CreateMachine,
  On,
} from "./types";

export * from "./types";
const watchEntryGlobalHook = "__global__";
export function createMachine<
  TMachine extends MachineSchema,
  TContext extends Partial<Record<TMachine["state"], unknown>> = {},
  GlobalContext extends Record<string, unknown> = {}
>(
  id: string,
  builder: CreateMachine<TMachine>
): Machine<TMachine, TContext, GlobalContext> {
  const state = <S extends TMachine["state"]>(
    state: S,
    transitions: () => Array<
      On<TMachine["action"], Exclude<TMachine["state"], S>>
    >,
    options: { clearOnExit?: boolean } = { clearOnExit: false }
  ): StateDefinition<TMachine> => {
    return {
      name: state,
      transitions: transitions(),
      options,
    };
  };

  const stateDefinitions = builder({ state });

  if (stateDefinitions.length === 0) {
    throw new Error("Machine must have at least one state");
  }

  const initialState = stateDefinitions[0]?.name as TMachine["state"];
  let currentState = initialState;
  let globalContext: GlobalContext = {} as GlobalContext;
  let globalLocked = false;
  const privateContexts: TContext = {} as TContext;
  const entryWatchers: Record<
    string,
    ((ctx: unknown, state?: TMachine["state"]) => void)[]
  > = {};
  const exitWatchers: Record<string, ((ctx: unknown) => void)[]> = {};
  const dynamicClearOnExit: Record<string, boolean> = {};

  const stateMap = new Map<string, StateDefinition<TMachine>>();
  const transitionMap = new Map<string, Map<string, string>>();

  stateDefinitions.forEach((stateDef) => {
    stateMap.set(stateDef.name, stateDef);
    const transitions = new Map<string, string>();
    stateDef.transitions.forEach((transition) => {
      transitions.set(transition.event, transition.target);
    });
    transitionMap.set(stateDef.name, transitions);
  });

  function transition(event: TMachine["action"]): void {
    const transitions = transitionMap.get(currentState);
    const target = transitions?.get(event);

    if (target && stateMap.has(target)) {
      const currentStateDef = stateMap.get(currentState);

      exitWatchers[currentState]?.forEach((fn) =>
        fn(privateContexts[currentState])
      );

      // Clear context if clearOnExit is true (check both static and dynamic configuration)
      const shouldClearContext =
        dynamicClearOnExit[event] !== undefined
          ? dynamicClearOnExit[event]
          : currentStateDef?.options?.clearOnExit ?? false;

      if (shouldClearContext) {
        delete privateContexts[currentState];
      }

      currentState = target;
      console.log("[test]1", entryWatchers);

      entryWatchers[currentState]?.forEach((fn) =>
        fn(privateContexts[currentState])
      );
      entryWatchers[watchEntryGlobalHook]?.forEach((fn) => {
        fn(privateContexts[currentState], currentState);
      });
    } else {
      console.warn(
        `currentState is ${currentState}, cannot transition to ${target} by action "${event}"`
      );
    }
  }

  function can(state: string, event: string): boolean {
    const transitions = transitionMap.get(state);
    return transitions?.has(event) || false;
  }

  function setGlobalOnly(ctx: GlobalContext): void {
    if (!globalLocked) {
      globalContext = ctx;
      globalLocked = true;
    } else {
      console.warn("Global context can only be set once");
    }
  }

  function getContext<TState extends keyof TContext>(
    state: TState
  ): TContext[TState] | undefined {
    return privateContexts[state] as TContext[TState] | undefined;
  }

  function setContext<TState extends keyof TContext>(
    state: TState,
    context: TContext[TState]
  ): void {
    privateContexts[state] = context;
  }

  function setClearContextOnExit(event: string, shouldClear: boolean): void {
    dynamicClearOnExit[event] = shouldClear;
  }

  function watchEntry<TContext = unknown>(
    state: string,
    fn: (context: TContext) => void
  ): () => void {
    if (!entryWatchers[state]) {
      entryWatchers[state] = [];
    }
    entryWatchers[state].push(fn as (context: unknown) => void);

    return () => {
      entryWatchers[state] = [];
    };
  }

  function watchEntryGlobal<TContext = unknown>(
    fn: (context: TContext, state: TMachine["state"]) => void
  ) {
    if (!entryWatchers[watchEntryGlobalHook]) {
      entryWatchers[watchEntryGlobalHook] = [];
    }
    entryWatchers[watchEntryGlobalHook].push(fn as (context: unknown) => void);

    return () => {
      entryWatchers[watchEntryGlobalHook] = [];
    };
  }

  function watchExit<TContext = unknown>(
    state: string,
    fn: (context: TContext) => void
  ): () => void {
    if (!exitWatchers[state]) {
      exitWatchers[state] = [];
    }
    exitWatchers[state].push(fn as (context: unknown) => void);

    return () => {
      exitWatchers[state] = exitWatchers[state]?.filter((f) => f !== fn) || [];
    };
  }

  function toXStateJSON(): XStateConfig {
    const states: Record<string, { on?: Record<string, string> }> = {};

    stateDefinitions.forEach((stateDef) => {
      const on: Record<string, string> = {};
      stateDef.transitions.forEach((transition) => {
        on[transition.event] = transition.target;
      });
      states[stateDef.name] = { on };
    });

    return {
      id,
      initial: initialState,
      states,
    };
  }

  return {
    id,
    get current() {
      return currentState;
    },
    get context() {
      return privateContexts[currentState];
    },
    get globalContext() {
      return globalContext;
    },
    transition,
    can,
    setGlobalOnly,
    getContext,
    setContext,
    setClearContextOnExit,
    watchEntry,
    watchExit,
    watchEntryGlobal,
    toXStateJSON,
  };
}

// Helper function to create a machine with better type inference
// export function createMachineWithContext<
//   TContexts extends Record<string, unknown>
// >() {
//   return function <TMachineId extends string>(
//     id: TMachineId,
//     builder: (ctx: BuilderContext) => StateDefinition[]
//   ): Machine<TContexts> {
//     return createMachine<TContexts>(id, builder);
//   };
// }

// Helper to create typed transition function
// export function createTypedTransition<
//   TContexts extends Record<string, unknown>
// >(machine: Machine<TContexts>) {
//   return function <TState extends keyof TContexts>(
//     event: string,
//     context?: TContexts[TState]
//   ): void {
//     machine.currentState.transition(event, context);
//   };
// }
