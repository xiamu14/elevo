import { createMachine } from 'elevo';

export const todoMachine = createMachine("todo", (ctx) => {
  const { state, on } = ctx;

  return [
    state("pending", () => [
      on("START", "active"),
      on("COMPLETE", "completed")
    ]),
    state("active", () => [
      on("PAUSE", "pending"),
      on("COMPLETE", "completed"),
      on("CANCEL", "cancelled")
    ]),
    state("completed", () => [
      on("REOPEN", "pending")
    ]),
    state("cancelled", () => [
      on("RESTORE", "pending")
    ])
  ];
});