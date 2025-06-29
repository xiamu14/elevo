import React from 'react';
import { Clock, FileText, Zap } from 'lucide-react';
import type { StateFileInfo } from '../types';

interface SidebarProps {
  states: StateFileInfo[];
  selectedState: StateFileInfo | null;
  onStateSelect: (state: StateFileInfo) => void;
  isConnected: boolean;
}

export function Sidebar({ states, selectedState, onStateSelect, isConnected }: SidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Elevo Visualizer</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* State Machines List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            State Machines ({states.length})
          </h2>
          
          {states.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No state machines found</p>
              <p className="text-xs mt-1">
                Make sure your CLI is running and watching *.state.ts files
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {states.map((state) => (
                <button
                  key={state.filePath}
                  onClick={() => onStateSelect(state)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all duration-200
                    ${selectedState?.filePath === state.filePath
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {state.machineName}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {state.filePath.split('/').pop()}
                      </p>
                    </div>
                    <div className="ml-2 text-xs text-gray-400">
                      {Object.keys(state.xstateJson.states).length} states
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(state.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Elevo CLI Visualizer</p>
          <p className="mt-1">Real-time state machine visualization</p>
        </div>
      </div>
    </div>
  );
}