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
  (name: string, builder: () => TransitionDefinition[]): StateDefinition;
}

export interface TransitionBuilder {
  (event: string, target: string): TransitionDefinition;
}

export interface StateDefinition {
  name: string;
  transitions: TransitionDefinition[];
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
  transition<TEvent extends string>(
    event: TEvent,
    context?: unknown
  ): void;
}

export interface Machine<TStates extends Record<string, unknown>> {
  readonly id: string;
  readonly current: keyof TStates;
  readonly context: unknown;
  readonly globalContext: Record<string, unknown>;
  readonly currentState: CurrentState<TStates, keyof TStates>;

  transition(event: string): void;
  can(state: keyof TStates, event: string): boolean;
  setGlobalOnly(ctx: Record<string, unknown>): void;
  watchEntry(state: keyof TStates, fn: (context: unknown) => void): () => void;
  watchExit(state: keyof TStates, fn: (context: unknown) => void): () => void;
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
