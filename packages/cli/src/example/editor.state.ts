import { createMachine } from "elevo";

export const editorMachine = createMachine("editor", (ctx) => {
  const { state, on } = ctx;

  return [
    state("idle", () => [on("EDIT", "editing")]),
    state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
    state("saving", () => [on("SUCCESS", "idle"), on("FAILURE", "editing")]),
  ];
});

// Set global context
editorMachine.setGlobalOnly({ user: "developer" });
