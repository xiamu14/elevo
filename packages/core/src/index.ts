import type {
  StateBuilder,
  TransitionBuilder,
  BuilderContext,
  Machine,
  CurrentState,
  StateDefinition,
  TransitionDefinition,
  XStateConfig,
} from "./types";

export * from "./types";

export function createMachine<TStates extends Record<string, unknown>>(
  id: string,
  builder: (ctx: BuilderContext) => StateDefinition[]
): Machine<TStates> {
  const builderCtx = createBuilderContext();
  const stateDefinitions = builder(builderCtx);

  if (stateDefinitions.length === 0) {
    throw new Error("Machine must have at least one state");
  }

  const initialState = stateDefinitions[0]?.name ?? "idle";
  let currentState = initialState;
  let globalContext: Record<string, unknown> = {};
  let globalLocked = false;
  const privateContexts: Record<string, unknown> = {};
  const entryWatchers: Record<string, ((ctx: unknown) => void)[]> = {};
  const exitWatchers: Record<string, ((ctx: unknown) => void)[]> = {};

  const stateMap = new Map<string, StateDefinition>();
  const transitionMap = new Map<string, Map<string, string>>();

  stateDefinitions.forEach((stateDef) => {
    stateMap.set(stateDef.name, stateDef);
    const transitions = new Map<string, string>();
    stateDef.transitions.forEach((transition) => {
      transitions.set(transition.event, transition.target);
    });
    transitionMap.set(stateDef.name, transitions);
  });

  function transition(event: string): void {
    const transitions = transitionMap.get(currentState);
    const target = transitions?.get(event);

    if (target && stateMap.has(target)) {
      exitWatchers[currentState]?.forEach((fn) =>
        fn(privateContexts[currentState])
      );

      currentState = target;

      entryWatchers[currentState]?.forEach((fn) =>
        fn(privateContexts[currentState])
      );
    }
  }

  function can(state: string, event: string): boolean {
    const transitions = transitionMap.get(state);
    return transitions?.has(event) || false;
  }

  function setGlobalOnly<TGlobal extends Record<string, unknown>>(ctx: TGlobal): void {
    if (!globalLocked) {
      globalContext = ctx;
      globalLocked = true;
    } else {
      console.warn("Global context can only be set once");
    }
  }

  function getContext<TState extends keyof TStates>(state: TState): TStates[TState] | undefined {
    return privateContexts[state as string] as TStates[TState] | undefined;
  }

  function setContext<TState extends keyof TStates>(state: TState, context: TStates[TState]): void {
    privateContexts[state as string] = context;
  }

  function watchEntry<TContext = unknown>(state: string, fn: (context: TContext) => void): () => void {
    if (!entryWatchers[state]) {
      entryWatchers[state] = [];
    }
    entryWatchers[state].push(fn as (context: unknown) => void);

    return () => {
      entryWatchers[state] =
        entryWatchers[state]?.filter((f) => f !== fn) || [];
    };
  }

  function watchExit<TContext = unknown>(state: string, fn: (context: TContext) => void): () => void {
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

  const currentStateProxy: CurrentState<TStates, keyof TStates> = {
    transition<TEvent extends string, TContext = unknown>(event: TEvent, context?: TContext): void {
      const transitions = transitionMap.get(currentState);
      const target = transitions?.get(event);
      
      if (target && stateMap.has(target)) {
        // Exit current state
        exitWatchers[currentState]?.forEach((fn) =>
          fn(privateContexts[currentState])
        );
        
        // Update context before changing state
        if (context !== undefined) {
          privateContexts[target] = context;
        }
        
        // Change state
        currentState = target;
        
        // Enter new state
        entryWatchers[currentState]?.forEach((fn) =>
          fn(privateContexts[currentState])
        );
      }
    },
  };

  return {
    id,
    get current() {
      return currentState as keyof TStates;
    },
    get context() {
      return privateContexts[currentState] as TStates[keyof TStates];
    },
    get globalContext() {
      return globalContext;
    },
    get currentState() {
      return currentStateProxy;
    },
    transition,
    can,
    setGlobalOnly,
    getContext,
    setContext,
    watchEntry,
    watchExit,
    toXStateJSON,
  };
}

function createBuilderContext(): BuilderContext {
  const state: StateBuilder = <T = unknown>(
    name: string,
    builder: () => TransitionDefinition[]
  ): StateDefinition<T> => {
    const transitions = builder();
    return {
      name,
      transitions: transitions.map((t) => t as unknown as TransitionDefinition),
    } as StateDefinition<T>;
  };

  const on: TransitionBuilder = (event: string, target: string) => {
    return {
      event,
      target,
    } as TransitionDefinition;
  };

  return { state, on };
}

// Helper function to create a machine with better type inference
export function createMachineWithContext<TContexts extends Record<string, unknown>>() {
  return function<TMachineId extends string>(
    id: TMachineId,
    builder: (ctx: BuilderContext) => StateDefinition[]
  ): Machine<TContexts> {
    return createMachine<TContexts>(id, builder);
  };
}

// Helper to create typed transition function
export function createTypedTransition<TContexts extends Record<string, unknown>>(
  machine: Machine<TContexts>
) {
  return function<TState extends keyof TContexts>(
    event: string,
    context?: TContexts[TState]
  ): void {
    machine.currentState.transition(event, context);
  };
}
