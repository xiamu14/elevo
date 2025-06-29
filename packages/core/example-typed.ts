import { createMachineWithContext, createTypedTransition } from './src/index';

// Define context types for each state
interface EditorContexts {
  idle: undefined;
  editing: {
    fileName: string;
    content: string;
    lastModified: number;
  };
  saving: {
    fileName: string;
    content: string;
    saveStartTime: number;
  };
  error: {
    message: string;
    code: number;
  };
}

// Create a typed state machine factory
const createEditorMachine = createMachineWithContext<EditorContexts>();

// Create the machine
const editorMachine = createEditorMachine("editor", (ctx) => {
  const { state, on } = ctx;

  return [
    state("idle", () => [on("EDIT", "editing")]),
    state<EditorContexts['editing']>("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
    state<EditorContexts['saving']>("saving", () => [on("SUCCESS", "idle"), on("FAILURE", "error")], { clearOnExit: true }),
    state<EditorContexts['error']>("error", () => [on("RETRY", "editing"), on("DISMISS", "idle")], { clearOnExit: true })
  ];
});

// Set global context with type safety
editorMachine.setGlobalOnly({
  userId: "user-123",
  workspaceId: "workspace-456",
  theme: "dark"
});

// Create a typed transition helper
const transition = createTypedTransition(editorMachine);

// Use typed context in transitions - TypeScript will enforce correct types
transition<'editing'>("EDIT", {
  fileName: "document.md",
  content: "# Hello World",
  lastModified: Date.now()
});

// For saving state context
transition<'saving'>("SAVE", {
  fileName: "document.md",
  content: "# Hello World",
  saveStartTime: Date.now()
});

// Or use the regular method with explicit typing
editorMachine.currentState.transition("ERROR", {
  message: "Failed to save",
  code: 500
} as EditorContexts['error']);

// Watch with typed context
editorMachine.watchEntry<EditorContexts['editing']>("editing", (context) => {
  console.log(`Editing file: ${context.fileName}`);
  console.log(`Last modified: ${new Date(context.lastModified)}`);
});

editorMachine.watchEntry<EditorContexts['saving']>("saving", (context) => {
  console.log(`Saving file: ${context.fileName}`);
  console.log(`Save started at: ${new Date(context.saveStartTime)}`);
});

editorMachine.watchEntry<EditorContexts['error']>("error", (context) => {
  console.error(`Error ${context.code}: ${context.message}`);
});

// Dynamic configuration: Clear context on specific events
editorMachine.setClearContextOnExit("SUCCESS", true); // Clear saving context on successful save
editorMachine.setClearContextOnExit("CANCEL", true);  // Clear editing context when canceling
editorMachine.setClearContextOnExit("DISMISS", false); // Keep error context when dismissing (override static clearOnExit)

export { editorMachine };