import { createMachine } from "../index";
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

describe("createMachine", () => {
  it("should create a machine with functional DSL", () => {
    expect(editorMachine.id).toBe("editor");
    expect(editorMachine.current).toBe("idle");
  });

  it("should transition between states correctly", () => {
    const machine = editorMachine;

    expect(machine.current).toBe("idle");

    machine.transition("EDIT");
    expect(machine.current).toBe("editing");

    machine.transition("SAVE");
    expect(machine.current).toBe("saving");
  });

  it("should support can() method for checking valid transitions", () => {
    const machine = editorMachine;

    expect(machine.can("idle", "EDIT")).toBe(true);
    expect(machine.can("idle", "SAVE")).toBe(false);
    expect(machine.can("editing", "SAVE")).toBe(true);
    expect(machine.can("editing", "CANCEL")).toBe(true);
    expect(machine.can("editing", "EDIT")).toBe(false);
  });

  it("should manage global context correctly", () => {
    const machine = editorMachine;

    expect(machine.globalContext).toEqual({});

    machine.setGlobalOnly({ user: "will" });
    expect(machine.globalContext).toEqual({ user: "will" });

    // Should not update global context after first set
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    machine.setGlobalOnly({ user: "changed" });
    expect(machine.globalContext).toEqual({ user: "will" });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Global context can only be set once"
    );

    consoleWarnSpy.mockRestore();
  });

  it("should support watch functionality", () => {
    type Schema = { state: "end" | "start"; action: "GO" | "RESET" };
    const machine = createMachine<Schema>("test", (ctx) => {
      const { state } = ctx;
      return [
        state("start", () => [{ event: "GO", target: "end" }]),
        state("end", () => [{ event: "RESET", target: "start" }]),
      ];
    });

    const entryMock = jest.fn();
    const exitMock = jest.fn();

    const unsubscribeEntry = machine.watchEntry("end", entryMock);
    const unsubscribeExit = machine.watchExit("start", exitMock);

    machine.transition("GO");

    expect(entryMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledTimes(1);

    unsubscribeEntry();
    unsubscribeExit();

    machine.transition("RESET");

    // Should not call watchers after unsubscribe
    expect(entryMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledTimes(1);
  });

  it("should export XState compatible JSON", () => {
    const machine = editorMachine;

    const xstateJson = machine.toXStateJSON();

    expect(xstateJson).toEqual({
      id: "editor",
      initial: "idle",
      states: {
        idle: {
          on: {
            EDIT: "editing",
          },
        },
        editing: {
          on: {
            SAVE: "saving",
            CANCEL: "idle",
          },
        },
        saving: {
          on: {
            SUCCESS: "idle",
            FAILURE: "editing",
          },
        },
      },
    });
  });

  it("should throw error for empty state machine", () => {
    expect(() => {
      createMachine("empty", () => []);
    }).toThrow("Machine must have at least one state");
  });

  it("should support getContext and setContext for state-specific contexts", () => {
    const machine = editorMachine;

    // Test setting and getting context for different states
    machine.setContext("saving", { no: "test.txt", progress: 50 });

    expect(machine.getContext("saving")).toEqual({
      no: "test.txt",
      progress: 50,
    });
    expect(machine.getContext("idle")).toBeUndefined();

    // Test that context persists across state transitions
    machine.transition("EDIT");
    expect(machine.current).toBe("editing");
    expect(machine.context).toEqual(undefined);

    machine.transition("SAVE");
    expect(machine.current).toBe("saving");
    expect(machine.context).toEqual({ no: "test.txt", progress: 50 });

    // Test global context with type safety
    machine.setGlobalOnly({
      userId: "user123",
      theme: "dark",
    });
    expect(machine.globalContext).toEqual({ userId: "user123", theme: "dark" });
  });

  it("should support clearOnExit option for state contexts", () => {
    const machine = editorMachine;

    // Machine starts at "temp" state (first state defined)
    expect(machine.current).toBe("idle");

    // Set context for temp state
    machine.setContext("saving", { no: "temporary", progress: 12 });
    expect(machine.getContext("saving")).toEqual({
      no: "temporary",
      progress: 12,
    });

    // Transition from temp to persistent (should clear temp context due to clearOnExit: true)
    machine.transition("EDIT");
    expect(machine.current).toBe("editing");

    // Check that temp context was cleared (clearOnExit: true)
    expect(machine.getContext("editing")).toBeUndefined();

    // Check that persistent context exists
    expect(machine.getContext("saving")).toEqual({
      no: "temporary",
      progress: 12,
    });

    // Transition to final state (should NOT clear persistent context due to clearOnExit: false)
    machine.transition("SAVE");
    expect(machine.current).toBe("saving");
    machine.transition("SUCCESS");

    // Check that persistent context was NOT cleared (clearOnExit: false)
    expect(machine.getContext("saving")).toEqual(undefined);
  });
});
