export type Event = string;

export interface StateConfig<TContext = unknown> {
  on?: Record<string, string>;
  context?: TContext;
}

export interface MachineConfig<TStates extends Record<string, StateConfig>> {
  id: string;
  initial: keyof TStates;
  states: TStates;
}

export interface StateBuilder {
  <T = unknown>(name: string, builder: () => TransitionDefinition[], options?: { clearOnExit?: boolean }): StateDefinition<T>;
}

export interface TransitionBuilder {
  (event: string, target: string): TransitionDefinition;
}

export interface StateDefinition<T = unknown> {
  name: string;
  transitions: TransitionDefinition[];
  contextType?: T; // For type inference only
  clearOnExit?: boolean; // Whether to clear private context when leaving this state
}

export interface TransitionDefinition {
  event: string;
  target: string;
}

export interface BuilderContext {
  state: StateBuilder;
  on: TransitionBuilder;
}

export interface MachineBuilder<TStates extends Record<string, unknown>> {
  (
    id: string,
    builder: (ctx: BuilderContext) => StateDefinition[]
  ): Machine<TStates>;
}

export interface CurrentState<
  TStates extends Record<string, unknown>,
  TCurrentState extends keyof TStates
> {
  transition<TEvent extends string, TContext = unknown>(
    event: TEvent,
    context?: TContext
  ): void;
}

export interface Machine<TStates extends Record<string, unknown>> {
  readonly id: string;
  readonly current: keyof TStates;
  readonly context: TStates[keyof TStates];
  readonly globalContext: Record<string, unknown>;
  readonly currentState: CurrentState<TStates, keyof TStates>;

  transition(event: string): void;
  can(state: keyof TStates, event: string): boolean;
  setGlobalOnly<TGlobal extends Record<string, unknown>>(ctx: TGlobal): void;
  
  // State-specific context methods
  getContext<TState extends keyof TStates>(state: TState): TStates[TState] | undefined;
  setContext<TState extends keyof TStates>(state: TState, context: TStates[TState]): void;
  
  // Dynamic context clearing configuration
  setClearContextOnExit(event: string, shouldClear: boolean): void;
  
  watchEntry<TContext = unknown>(state: keyof TStates, fn: (context: TContext) => void): () => void;
  watchExit<TContext = unknown>(state: keyof TStates, fn: (context: TContext) => void): () => void;
  toXStateJSON(): XStateConfig;
}

export interface XStateConfig {
  id: string;
  initial: string;
  states: Record<
    string,
    {
      on?: Record<string, string | { target: string; actions?: string[] }>;
    }
  >;
}

export interface MachineSnapshot<TMachine extends Machine<Record<string, unknown>>> {
  current: TMachine["current"];
  context: TMachine["context"];
  globalContext: TMachine["globalContext"];
}

// Type helper for defining state machines with typed contexts
export type StateContextMap<TStates extends Record<string, unknown>> = {
  [K in keyof TStates]: TStates[K];
};
