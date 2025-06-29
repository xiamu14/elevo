import React from 'react';
import { createMachine } from 'elevo';
import { useMachine, Show } from './index';

// Create the state machine
const editorMachine = createMachine("editor", (ctx) => {
  const { state, on } = ctx;

  return [
    state("idle", () => [on("EDIT", "editing")]),
    state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
    state("saving", () => [on("SUCCESS", "idle"), on("FAILURE", "editing")]),
  ];
});

// Set global context
editorMachine.setGlobalOnly({ user: "will" });

function EditorComponent() {
  const editorMachineSnapshot = useMachine(editorMachine);
  const { context, current, globalContext, currentState } = editorMachineSnapshot;

  const handleEdit = () => {
    currentState.transition("EDIT", { fileName: "test.ts" });
  };

  const handleSave = () => {
    currentState.transition("SAVE", { fileName: "test.ts", content: "Hello World" });
  };

  const handleCancel = () => {
    currentState.transition("CANCEL");
  };

  const handleSuccess = () => {
    currentState.transition("SUCCESS");
  };

  const handleFailure = () => {
    currentState.transition("FAILURE", { error: "Save failed" });
  };

  return (
    <div>
      <h1>Editor State: {current}</h1>
      <p>User: {globalContext.user}</p>
      <p>Context: {JSON.stringify(context)}</p>

      <Show when={current === "idle"}>
        <div>
          <button onClick={handleEdit}>Start Editing</button>
        </div>
      </Show>

      <Show when={current === "editing"}>
        <div>
          <p>Editing file: {context?.fileName}</p>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      </Show>

      <Show when={current === "saving"}>
        <div>
          <p>Saving...</p>
          <button onClick={handleSuccess}>Simulate Success</button>
          <button onClick={handleFailure}>Simulate Failure</button>
        </div>
      </Show>
    </div>
  );
}

export default EditorComponent;