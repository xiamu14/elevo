import { createMachine } from "../index";

describe("createMachine", () => {
  it("should create a machine with functional DSL", () => {
    const editorMachine = createMachine("editor", (ctx) => {
      const { state, on } = ctx;

      return [
        state("idle", () => [on("EDIT", "editing")]),
        state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
        state("saving", () => [
          on("SUCCESS", "idle"),
          on("FAILURE", "editing"),
        ]),
      ];
    });

    expect(editorMachine.id).toBe("editor");
    expect(editorMachine.current).toBe("idle");
  });

  it("should transition between states correctly", () => {
    const machine = createMachine("test", (ctx) => {
      const { state, on } = ctx;
      return [
        state("start", () => [on("GO", "end")]),
        state("end", () => [on("RESET", "start")]),
      ];
    });

    expect(machine.current).toBe("start");

    machine.transition("GO");
    expect(machine.current).toBe("end");

    machine.transition("RESET");
    expect(machine.current).toBe("start");
  });

  it("should handle invalid transitions gracefully", () => {
    const machine = createMachine("test", (ctx) => {
      const { state, on } = ctx;
      return [state("start", () => [on("GO", "end")]), state("end", () => [])];
    });

    expect(machine.current).toBe("start");

    machine.transition("INVALID");
    expect(machine.current).toBe("start");

    machine.transition("GO");
    expect(machine.current).toBe("end");

    machine.transition("INVALID");
    expect(machine.current).toBe("end");
  });

  it("should support can() method for checking valid transitions", () => {
    const machine = createMachine("test", (ctx) => {
      const { state, on } = ctx;
      return [
        state("idle", () => [on("EDIT", "editing")]),
        state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
        state("saving", () => [on("SUCCESS", "idle")]),
      ];
    });

    expect(machine.can("idle", "EDIT")).toBe(true);
    expect(machine.can("idle", "SAVE")).toBe(false);
    expect(machine.can("editing", "SAVE")).toBe(true);
    expect(machine.can("editing", "CANCEL")).toBe(true);
    expect(machine.can("editing", "EDIT")).toBe(false);
  });

  it("should manage global context correctly", () => {
    const machine = createMachine("test", (ctx) => {
      const { state, on } = ctx;
      return [state("start", () => [on("GO", "end")]), state("end", () => [])];
    });

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

  it("should manage private context per state", () => {
    const machine = createMachine("test", (ctx) => {
      const { state, on } = ctx;
      return [
        state("start", () => [on("GO", "end")]),
        state("end", () => [on("RESET", "start")]),
      ];
    });

    expect(machine.context).toBeUndefined();

    machine.currentState.transition("GO", { name: "test" });
    expect(machine.current).toBe("end");
    expect(machine.context).toEqual({ name: "test" });

    machine.currentState.transition("RESET", { name: "start context" });
    expect(machine.current).toBe("start");
    expect(machine.context).toEqual({ name: "start context" });
  });

  it("should support watch functionality", () => {
    const machine = createMachine("test", (ctx) => {
      const { state, on } = ctx;
      return [
        state("start", () => [on("GO", "end")]),
        state("end", () => [on("RESET", "start")]),
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
    const machine = createMachine("editor", (ctx) => {
      const { state, on } = ctx;
      return [
        state("idle", () => [on("EDIT", "editing")]),
        state("editing", () => [on("SAVE", "saving"), on("CANCEL", "idle")]),
        state("saving", () => [
          on("SUCCESS", "idle"),
          on("FAILURE", "editing"),
        ]),
      ];
    });

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
});
