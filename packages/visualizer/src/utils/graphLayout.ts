import dagre from "@dagrejs/dagre";
import type { XStateConfig, GraphNode, GraphEdge } from "../types";

export function createGraphFromXState(xstateConfig: XStateConfig): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create nodes
  Object.entries(xstateConfig.states).forEach(([stateName, stateConfig]) => {
    const transitions = Object.keys(stateConfig.on || {});

    nodes.push({
      id: stateName,
      type: "state",
      data: {
        label: stateName,
        isInitial: stateName === xstateConfig.initial,
        transitions,
      },
      position: { x: 0, y: 0 }, // Will be calculated by layout
    });
  });

  // Create edges
  Object.entries(xstateConfig.states).forEach(([stateName, stateConfig]) => {
    if (stateConfig.on) {
      Object.entries(stateConfig.on).forEach(([event, target]) => {
        const targetState = typeof target === "string" ? target : target.target;

        edges.push({
          id: `${stateName}-${event}-${targetState}`,
          source: stateName,
          target: targetState,
          label: event,
        });
      });
    }
  });

  return { nodes, edges };
}

export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 172;
  const nodeHeight = 36;

  const getLayoutedElements = (
    nodes: GraphNode[],
    edges: GraphEdge[],
    direction = "TB"
  ) => {
    const isHorizontal = direction === "LR";
    dagreGraph.setGraph({
      rankdir: direction,
      marginx: 30,
      marginy: 30,
      nodesep: 300,
      ranksep: 100,
    });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const newNode = {
        ...node,
        targetPosition: isHorizontal ? "left" : "top",
        sourcePosition: isHorizontal ? "right" : "bottom",
        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };

      return newNode;
    });

    return { nodes: newNodes, edges };
  };
  const result = getLayoutedElements(nodes, edges);
  return result;
}
