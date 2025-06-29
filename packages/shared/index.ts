// packages/elevo/src/types.ts

/**
 * 事件字符串字面量类型。
 */
export type Event = string;

/**
 * 状态机通用类型定义
 *
 * @template TState - 所有状态名的联合类型（字符串）
 * @template TContextMap - 每个状态对应的上下文结构（Record）
 * @template TEvent - 所有事件的联合类型（字符串）
 */
export interface StateMachine<
  TState extends string,
  TContextMap extends Record<TState, any>,
  TEvent extends string
> {
  state: TState;
  value: TState;
  getContext(): TContextMap[TState];
  setContext<K extends TState>(state: K, context: TContextMap[K]): void;
  transition(event: TEvent): void;
  can(from: TState, event: TEvent): boolean;
  setGlobalOnly(ctx: Record<string, unknown>): void;
  getGlobal(): Record<string, unknown>;
  watchEntry(state: TState, fn: (ctx: TContextMap[TState]) => void): () => void;
  watchExit(state: TState, fn: (ctx: TContextMap[TState]) => void): () => void;

  /**
   * 状态图导出
   */
  toXStateJSON(): unknown;

  /**
   * 类型辅助字段（仅类型提示，不运行时使用）
   */
  __states: TContextMap;
  __event: TEvent;
}

/**
 * 快照类型：当前状态 + 当前状态对应的上下文
 */
export type MachineSnapshot<T extends StateMachine<any, any, any>> = {
  state: T["state"];
  value: T["value"];
  context: ReturnType<T["getContext"]>;
};
