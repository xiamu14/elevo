import React, { useState, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { StateMachineGraph } from "./components/StateMachineGraph";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { useWebSocket } from "./hooks/useWebSocket";
import type { StateFileInfo } from "./types";
import "./App.css";
import { Unplug } from "lucide-react";

function App() {
  const [selectedState, setSelectedState] = useState<StateFileInfo | null>(
    null
  );

  // Get token from URL params
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "dev-token";
  }, []);

  const { states, isConnected, error, reconnect } = useWebSocket(
    "ws://localhost:8080",
    token
  );

  // Auto-select first state when states change
  React.useEffect(() => {
    if (states.length > 0 && !selectedState) {
      setSelectedState(states[0]);
    }
  }, [states, selectedState]);

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        states={states}
        selectedState={selectedState}
        onStateSelect={setSelectedState}
        isConnected={isConnected}
      />

      <main className="flex-1 flex flex-col">
        {selectedState ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 h-[80px]">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedState.machineName}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedState.filePath}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    States:{" "}
                    {Object.keys(selectedState.xstateJson.states).length}
                  </span>
                  <span>Initial: {selectedState.xstateJson.initial}</span>
                  <span>
                    Updated:{" "}
                    {new Date(selectedState.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Graph */}
            <div className="flex-1 bg-gray-50">
              <StateMachineGraph stateInfo={selectedState} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              {/* <img src={EmptyPicture} className="w-[100px] h-[100px] mb-2" /> */}
              <div className="w-full flex justify-center items-center mb-[10px]">
                <Unplug color="oklch(63.7% 0.237 25.331)" size={30} />
              </div>
              <h2 className="text-lg font-medium mb-2">
                No State Machine Selected
              </h2>
              <p className="text-sm">
                {states.length === 0
                  ? "Waiting for state machines from Elevo CLI..."
                  : "Select a state machine from the sidebar to visualize"}
              </p>
            </div>
          </div>
        )}
      </main>

      <ConnectionStatus
        isConnected={isConnected}
        error={error}
        onReconnect={reconnect}
      />
    </div>
  );
}

export default App;
