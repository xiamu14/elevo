import { createMachine } from './src/index';

// Example usage demonstrating the functional DSL approach
const editorMachine = createMachine("editor", (ctx) => {
  const { state, on } = ctx;

  return [
    state("idle", () => [on("EDIT", "editing")]),
    state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
    state("saving", () => [on("SUCCESS", "idle"), on("FAILURE", "editing")]),
  ];
});

// Set global context (can only be set once)
editorMachine.setGlobalOnly({ user: "will" });

// Check transitions
console.log(editorMachine.can("editing", "SAVE")); // => true
console.log(editorMachine.can("idle", "CANCEL")); // => false

// Transition with context
console.log(editorMachine.current); // => "idle"
editorMachine.currentState.transition("EDIT", { fileName: "test.ts" });
console.log(editorMachine.current); // => "editing"
console.log(editorMachine.context); // => { fileName: "test.ts" }

// Watch state changes
const unsubscribe = editorMachine.watchEntry("saving", (context) => {
  console.log("Entering saving state with context:", context);
});

editorMachine.currentState.transition("SAVE", { fileName: "test.ts", content: "..." });
console.log(editorMachine.current); // => "saving"

// Export XState compatible JSON
console.log(JSON.stringify(editorMachine.toXStateJSON(), null, 2));