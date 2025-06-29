import dagre from 'dagre';
import type { XStateConfig, GraphNode, GraphEdge } from '../types';

export function createGraphFromXState(xstateConfig: XStateConfig): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create nodes
  Object.entries(xstateConfig.states).forEach(([stateName, stateConfig]) => {
    const transitions = Object.keys(stateConfig.on || {});
    
    nodes.push({
      id: stateName,
      type: 'state',
      data: {
        label: stateName,
        isInitial: stateName === xstateConfig.initial,
        transitions
      },
      position: { x: 0, y: 0 } // Will be calculated by layout
    });
  });

  // Create edges
  Object.entries(xstateConfig.states).forEach(([stateName, stateConfig]) => {
    if (stateConfig.on) {
      Object.entries(stateConfig.on).forEach(([event, target]) => {
        const targetState = typeof target === 'string' ? target : target.target;
        
        edges.push({
          id: `${stateName}-${event}-${targetState}`,
          source: stateName,
          target: targetState,
          label: event,
          type: 'smoothstep'
        });
      });
    }
  });

  return { nodes, edges };
}

export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const g = new dagre.graphlib.Graph();
  
  g.setGraph({
    rankdir: 'TB',
    align: 'UL',
    nodesep: 50,
    ranksep: 100,
    marginx: 20,
    marginy: 20
  });
  
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: 120,
      height: 60
    });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(g);

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2
      }
    };
  });

  return {
    nodes: layoutedNodes,
    edges
  };
}