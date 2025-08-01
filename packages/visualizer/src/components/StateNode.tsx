import { Handle, Position } from "@xyflow/react";

interface StateNodeProps {
  data: {
    label: string;
    isInitial: boolean;
    transitions: string[];
  };
  selected: boolean;
}

export function StateNode({ data, selected }: StateNodeProps) {
  return (
    <div
      className={`
      relative px-4 py-3 rounded-lg border-2 bg-white shadow-lg transition-all duration-200
      ${
        data.isInitial
          ? "border-green-500 bg-green-50"
          : "border-gray-300 hover:border-blue-400"
      }
      ${selected ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
    `}
    >
      {/* @ts-ignore */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-1 h-1 bg-blue-500 opacity-0"
      />

      <div className="text-center">
        <div
          className={`
          font-semibold text-sm
          ${data.isInitial ? "text-green-800" : "text-gray-800"}
        `}
        >
          {data.label}
        </div>

        {data.isInitial && (
          <div className="text-xs text-green-600 mt-1">Initial State</div>
        )}

        {data.transitions.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Events: {data.transitions.join(", ")}
          </div>
        )}
      </div>
      {/* @ts-ignore */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-1 h-1 bg-blue-500 opacity-0"
      />
    </div>
  );
}
