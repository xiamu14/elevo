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

  function setGlobalOnly(ctx: Record<string, unknown>): void {
    if (!globalLocked) {
      globalContext = ctx;
      globalLocked = true;
    } else {
      console.warn("Global context can only be set once");
    }
  }

  function watchEntry(state: string, fn: (context: unknown) => void): () => void {
    if (!entryWatchers[state]) {
      entryWatchers[state] = [];
    }
    entryWatchers[state].push(fn);

    return () => {
      entryWatchers[state] =
        entryWatchers[state]?.filter((f) => f !== fn) || [];
    };
  }

  function watchExit(state: string, fn: (context: unknown) => void): () => void {
    if (!exitWatchers[state]) {
      exitWatchers[state] = [];
    }
    exitWatchers[state].push(fn);

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
    transition<TEvent extends string>(event: TEvent, context?: unknown): void {
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
      return privateContexts[currentState];
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
    watchEntry,
    watchExit,
    toXStateJSON,
  };
}

function createBuilderContext(): BuilderContext {
  const state: StateBuilder = (
    name: string,
    builder: () => TransitionDefinition[]
  ) => {
    const transitions = builder();
    return {
      name,
      transitions: transitions.map((t) => t as unknown as TransitionDefinition),
    };
  };

  const on: TransitionBuilder = (event: string, target: string) => {
    return {
      event,
      target,
    } as TransitionDefinition;
  };

  return { state, on };
}
