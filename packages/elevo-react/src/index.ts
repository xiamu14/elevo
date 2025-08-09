import { useEffect, useMemo } from "react";
import { useSnapshot, proxy, subscribe } from "valtio";
import type { Machine, MachineSchema } from "elevo";

export interface UseMachineReturn<TMachine extends Machine<any, any, any>> {
  current: TMachine["current"];
  context: TMachine["context"];
  globalContext: TMachine["globalContext"];
}

export function useMachine<TMachine extends Machine<any, any, any>>(
  machine: TMachine
): UseMachineReturn<TMachine> {
  const reactiveProxy = useMemo(() => {
    return proxy({
      current: machine.current,
      context: machine.getContext(machine.current),
      get globalContext() {
        return machine.globalContext;
      },
    });
  }, [machine]);

  const snapshot = useSnapshot(reactiveProxy);

  useEffect(() => {
    const unsubscribeEntry = machine.watchEntryGlobal((context, state) => {
      // Trigger proxy update when state changes
      reactiveProxy.current = state;
      reactiveProxy.context = context;
    });

    return () => {
      unsubscribeEntry();
    };
  }, [machine, reactiveProxy]);

  return {
    current: snapshot.current,
    context: snapshot.context,
    globalContext: snapshot.globalContext,
  };
}
