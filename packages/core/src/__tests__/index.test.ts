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

  it("should support getContext and setContext for state-specific contexts", () => {
    type StateContexts = {
      idle: undefined;
      editing: { fileName: string; content: string };
      saving: { fileName: string; progress: number };
      globalContext: { userId: string; theme: string };
    };

    const machine = createMachine<StateContexts>("test", (ctx) => {
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

    // Test setting and getting context for different states
    machine.setContext("editing", { fileName: "test.txt", content: "Hello" });
    machine.setContext("saving", { fileName: "test.txt", progress: 50 });

    expect(machine.getContext("editing")).toEqual({
      fileName: "test.txt",
      content: "Hello",
    });
    expect(machine.getContext("saving")).toEqual({
      fileName: "test.txt",
      progress: 50,
    });
    expect(machine.getContext("idle")).toBeUndefined();

    // Test that context persists across state transitions
    machine.transition("EDIT");
    expect(machine.current).toBe("editing");
    expect(machine.context).toEqual({ fileName: "test.txt", content: "Hello" });

    machine.transition("SAVE");
    expect(machine.current).toBe("saving");
    expect(machine.context).toEqual({ fileName: "test.txt", progress: 50 });

    // Test global context with type safety
    machine.setGlobalOnly({ userId: "user123", theme: "dark" } as StateContexts['globalContext']);
    expect(machine.globalContext).toEqual({ userId: "user123", theme: "dark" });
  });

  it("should support clearOnExit option for state contexts", () => {
    type StateContexts = {
      temp: { data: string };
      persistent: { data: string };
      final: undefined;
    };

    const machine = createMachine<StateContexts>("test", (ctx) => {
      const { state, on } = ctx;
      return [
        state<StateContexts['temp']>("temp", () => [on("NEXT", "persistent")], { clearOnExit: true }),
        state<StateContexts['persistent']>("persistent", () => [on("FINISH", "final")], { clearOnExit: false }),
        state("final", () => []),
      ];
    });

    // Machine starts at "temp" state (first state defined)
    expect(machine.current).toBe("temp");

    // Set context for temp state
    machine.setContext("temp", { data: "temporary" });
    expect(machine.getContext("temp")).toEqual({ data: "temporary" });

    // Transition from temp to persistent (should clear temp context due to clearOnExit: true)
    machine.currentState.transition("NEXT", { data: "persistent data" });
    expect(machine.current).toBe("persistent");
    
    // Check that temp context was cleared (clearOnExit: true)
    expect(machine.getContext("temp")).toBeUndefined();
    
    // Check that persistent context exists
    expect(machine.getContext("persistent")).toEqual({ data: "persistent data" });

    // Transition to final state (should NOT clear persistent context due to clearOnExit: false)
    machine.transition("FINISH");
    expect(machine.current).toBe("final");
    
    // Check that persistent context was NOT cleared (clearOnExit: false)
    expect(machine.getContext("persistent")).toEqual({ data: "persistent data" });
  });

  it("should support dynamic setClearContextOnExit configuration", () => {
    type StateContexts = {
      start: { data: string };
      middle: { data: string };
      end: undefined;
    };

    const machine = createMachine<StateContexts>("test", (ctx) => {
      const { state, on } = ctx;
      return [
        state("start", () => [on("NEXT", "middle"), on("SKIP", "end")]),
        state("middle", () => [on("FINISH", "end")]),
        state("end", () => []),
      ];
    });

    // Set context for start state
    machine.setContext("start", { data: "start data" });
    expect(machine.getContext("start")).toEqual({ data: "start data" });

    // Configure NEXT event to clear context dynamically
    machine.setClearContextOnExit("NEXT", true);
    
    // Transition with NEXT event (should clear start context)
    machine.transition("NEXT");
    expect(machine.current).toBe("middle");
    expect(machine.getContext("start")).toBeUndefined();

    // Test with a fresh machine for the second scenario
    const machine2 = createMachine<StateContexts>("test2", (ctx) => {
      const { state, on } = ctx;
      return [
        state("start", () => [on("NEXT", "middle"), on("SKIP", "end")]),
        state("middle", () => [on("FINISH", "end")]),
        state("end", () => []),
      ];
    });

    machine2.setContext("start", { data: "start data" });
    
    // Configure SKIP event to NOT clear context
    machine2.setClearContextOnExit("SKIP", false);
    
    // Transition with SKIP event (should NOT clear start context)
    machine2.transition("SKIP");
    expect(machine2.current).toBe("end");
    expect(machine2.getContext("start")).toEqual({ data: "start data" });
  });
});
