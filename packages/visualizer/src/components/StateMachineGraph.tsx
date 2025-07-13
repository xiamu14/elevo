import { useMemo } from "react";
import { Node, Edge, ReactFlow, MarkerType, EdgeTypes } from "@xyflow/react";
import { StateNode } from "./StateNode";
import { createGraphFromXState, layoutGraph } from "../utils/graphLayout";
import type { StateFileInfo } from "../types";
import "@xyflow/react/dist/style.css";
import CustomEdge from "./CustomEdge";

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const nodeTypes = {
  state: StateNode,
};

interface StateMachineGraphProps {
  stateInfo: StateFileInfo;
}

export function StateMachineGraph({ stateInfo }: StateMachineGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = createGraphFromXState(
      stateInfo.xstateJson
    );
    return layoutGraph(rawNodes, rawEdges);
  }, [stateInfo]);

  const reactFlowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));

  const reactFlowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    data: {
      label: edge.label,
    },
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: "#6366f1",
    },
    style: {
      stroke: "#6366f1",
      strokeWidth: 1,
    },
  }));

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        edgeTypes={edgeTypes}
      ></ReactFlow>
    </div>
  );
}
