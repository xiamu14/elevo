import { useEffect, useMemo } from "react";
import { useSnapshot, proxy, subscribe } from "valtio";
import type { Machine, MachineSnapshot } from "elevo-shared";

export interface UseMachineReturn<TMachine extends Machine<any>> {
  current: TMachine["current"];
  context: TMachine["context"];
  globalContext: TMachine["globalContext"];
  currentState: TMachine["currentState"];
}

export function useMachine<TMachine extends Machine<any>>(
  machine: TMachine
): UseMachineReturn<TMachine> {
  const reactiveProxy = useMemo(() => {
    return proxy({
      get current() {
        return machine.current;
      },
      get context() {
        return machine.context;
      },
      get globalContext() {
        return machine.globalContext;
      },
      get currentState() {
        return machine.currentState;
      },
    });
  }, [machine]);

  const snapshot = useSnapshot(reactiveProxy);

  useEffect(() => {
    const unsubscribe = subscribe(reactiveProxy, () => {
      // This will trigger re-renders via useSnapshot
    });

    return unsubscribe;
  }, [reactiveProxy]);

  useEffect(() => {
    const unsubscribeEntry = machine.watchEntry(
      machine.current as string,
      () => {
        // Trigger proxy update when state changes
        (reactiveProxy as any)._trigger?.();
      }
    );

    const unsubscribeExit = machine.watchExit(machine.current as string, () => {
      // Trigger proxy update when state changes
      (reactiveProxy as any)._trigger?.();
    });

    return () => {
      unsubscribeEntry();
      unsubscribeExit();
    };
  }, [machine, reactiveProxy]);

  return {
    current: snapshot.current,
    context: snapshot.context,
    globalContext: snapshot.globalContext,
    currentState: {
      transition: (event: string, context?: any) => {
        machine.currentState.transition(event, context);
        // Force proxy update
        Object.assign(reactiveProxy, {
          current: machine.current,
          context: machine.context,
          globalContext: machine.globalContext,
        });
      },
    } as TMachine["currentState"],
  };
}
