import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  ConnectionLineType
} from 'react-flow-renderer';
import { StateNode } from './StateNode';
import { createGraphFromXState, layoutGraph } from '../utils/graphLayout';
import type { StateFileInfo } from '../types';

const nodeTypes = {
  state: StateNode,
};

interface StateMachineGraphProps {
  stateInfo: StateFileInfo;
}

export function StateMachineGraph({ stateInfo }: StateMachineGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = createGraphFromXState(stateInfo.xstateJson);
    return layoutGraph(rawNodes, rawEdges);
  }, [stateInfo]);

  const reactFlowNodes: Node[] = nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));

  const reactFlowEdges: Edge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#6366f1',
      strokeWidth: 2 
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: 600,
      fill: '#4f46e5',
      background: 'white',
      padding: '2px 4px',
      borderRadius: '4px',
      border: '1px solid #e5e7eb'
    }
  }));

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
        defaultZoom={1}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls className="bg-white border border-gray-300 rounded-lg shadow-lg" />
        <MiniMap 
          className="bg-white border border-gray-300 rounded-lg shadow-lg"
          nodeColor={(node) => {
            if (node.data?.isInitial) return '#10b981';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}