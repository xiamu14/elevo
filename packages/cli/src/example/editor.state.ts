import { createMachine } from "elevo";

type Schema = {
  state: "idle" | "editing" | "saving";
  action: "EDIT" | "SAVE" | "SUCCESS" | "CANCEL" | "FAILURE";
};
type Context = {
  idle: { fileName: string; content: string };
  editing: undefined;
  saving: { no: string; progress: number };
};

const editorMachine = createMachine<Schema, Context>("editor", (ctx) => {
  const { state } = ctx;

  return [
    state("idle", () => [{ event: "EDIT", target: "editing" }]),
    state("editing", () => [{ event: "SAVE", target: "saving" }]),
    state("saving", () => [
      { event: "FAILURE", target: "editing" },
      { event: "SUCCESS", target: "idle" },
    ]),
  ];
});

// Set global context
editorMachine.setGlobalOnly({ user: "developer" });
