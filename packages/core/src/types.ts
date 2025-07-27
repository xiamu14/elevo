export type Event = string;

export type MachineSpec = {
  state: string;
  action: string;
};

export type Context<K extends string> = Record<K, unknown>;

export type On<T extends MachineSpec, From extends T["state"]> = {
  type: "transition";
  from: From;
  action: T["action"];
  to: Exclude<T["state"], From>;
};
type StateOptions = { clearOnExit?: boolean };
export type CreateMachine<T extends MachineSpec> = (ctx: {
  state: <S extends T["state"]>(
    state: S,
    transitions: Array<On<T, S>>,
    options?: StateOptions
  ) => StateDefinition<T>;
  on: <A extends T["action"], From extends T["state"]>(
    action: A,
    to: Exclude<T["state"], From>
  ) => On<T, From>;
}) => StateDefinition<T>[];

export interface StateConfig<TContext = unknown> {
  on?: Record<string, string>;
  context?: TContext;
}

export interface MachineConfig<TStates extends Record<string, StateConfig>> {
  id: string;
  initial: keyof TStates;
  states: TStates;
}

export interface StateDefinition<TMachine extends MachineSpec> {
  name: TMachine["state"];
  transitions: TransitionDefinition<TMachine>[];
  options: StateOptions;
}

export interface TransitionDefinition<TMachine extends MachineSpec> {
  event: TMachine["action"];
  target: TMachine["state"];
}

// export interface MachineBuilder<TStates extends Record<string, unknown>> {
//   (
//     id: string,
//     builder: (ctx: BuilderContext) => StateDefinition[]
//   ): Machine<TStates>;
// }

export interface CurrentState<
  TStates extends Record<string, unknown>,
  TCurrentState extends keyof TStates
> {
  transition<TEvent extends string, TContext = unknown>(
    event: TEvent,
    context?: TContext
  ): void;
}

export interface Machine<
  TMachine extends MachineSpec,
  TContext extends Record<TMachine["state"], unknown>,
  GlobalContext extends Record<string, unknown>
> {
  readonly id: string;
  readonly current: TMachine["state"];
  readonly context: TContext[TMachine["state"]];
  readonly globalContext: GlobalContext;

  transition<E extends TMachine["action"]>(event: E): void;
  can(state: TMachine["state"], event: TMachine["action"]): boolean;
  setGlobalOnly(ctx: GlobalContext): void;

  // State-specific context methods
  getContext<TState extends keyof TContext>(
    state: TState
  ): TContext[TState] | undefined;
  setContext<TState extends keyof TContext>(
    state: TState,
    context: TContext[TState]
  ): void;

  // Dynamic context clearing configuration
  setClearContextOnExit(event: string, shouldClear: boolean): void;

  watchEntry<TContext = unknown>(
    state: TMachine["state"],
    fn: (context: TContext) => void
  ): () => void;
  watchEntryGlobal<TContext = unknown>(
    fn: (context: TContext, state: TMachine["state"]) => void
  ): () => void;
  watchExit<TContext = unknown>(
    state: TMachine["state"],
    fn: (context: TContext) => void
  ): () => void;
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

// export interface MachineSnapshot<
//   TMachine extends Machine<Record<string, unknown>>
// > {
//   current: TMachine["current"];
//   context: TMachine["context"];
//   globalContext: TMachine["globalContext"];
// }

// Type helper for defining state machines with typed contexts
export type StateContextMap<TStates extends Record<string, unknown>> = {
  [K in keyof TStates]: TStates[K];
};
