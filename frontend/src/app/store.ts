import { create } from 'zustand';
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import type { CostBreakdown } from '@/types';

interface RFState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  updateNode: (nodeId: string, payload: Partial<Node>) => void;
  // Cost estimation state
  totalCost: number;
  costBreakdown: CostBreakdown;
  setCosts: (total: number, breakdown: CostBreakdown) => void;
}

// Initial State
const initialNodes: Node[] = [];

export const useStore = create<RFState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  totalCost: 0,
  costBreakdown: {},

  // 1. Handle Node Movements/Selection
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  // 2. Handle Edge Connections
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // 3. Handle New Connections (Line drawing)
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // 4. Add a new Node (Drag & Drop)
  addNode: (node: Node) => {
    set({
      nodes: [...get().nodes, node]
    })
  },

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // Merge existing data with new data (so we don't lose other props)
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    });
  },
  updateNode: (nodeId, payload) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // Merge core properties (like position, parentNode, style)
          return { ...node, ...payload };
        }
        return node;
      }),
    });
  },

  // Cost estimation
  setCosts: (total, breakdown) => {
    set({ totalCost: total, costBreakdown: breakdown });
  },

}));