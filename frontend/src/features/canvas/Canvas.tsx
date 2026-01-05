import React, { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useStore } from '@/app/store';
import { useThemeStore } from '@/app/themeStore';
import { VpcNode } from './nodes/VpcNode';
import { SubnetNode } from './nodes/SubnetNode';
import { ServiceNode } from './nodes/ServiceNode';
import { EksClusterNode } from './nodes/EksClusterNode';
import { EksNodeGroupNode } from './nodes/EksNodeGroupNode';
import { validatePlacement } from './utils/validation';
import { TotalCostCard } from '@/components/TotalCostCard';
import { estimateCosts } from '@/lib/api';
import type { CloudGraphNode } from '@/types';

const nodeTypes = {
  vpc: VpcNode,
  subnet: SubnetNode,
  service: ServiceNode,
  eks: EksClusterNode,
  'eks-node-group': EksNodeGroupNode,
};

const Z_LAYERS = {
  vpc: 10,
  subnet: 20,
  eks: 25,
  resource: 30,
};

function CanvasContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  // --- 1. NEW REF: To store original position before dragging starts ---
  const dragRef = useRef<{ id: string; position: { x: number; y: number }; parentNode: string | undefined } | null>(null);

  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const addNode = useStore((state) => state.addNode);
  const updateNode = useStore((state) => state.updateNode);
  const setCosts = useStore((state) => state.setCosts);

  const { screenToFlowPosition } = useReactFlow();

  // Cost estimation with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length === 0) {
        setCosts(0, {});
        return;
      }

      // Fetch cost estimates
      const fetchCosts = async () => {
        try {
          const response = await estimateCosts(nodes as CloudGraphNode[]);
          setCosts(response.total_monthly_cost, response.breakdown);
        } catch (error) {
          console.error('Failed to fetch cost estimates:', error);
        }
      };

      fetchCosts();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [nodes, setCosts]);

  const getAbsolutePosition = useCallback((node: Node | undefined): { x: number, y: number } => {
     if (!node) return { x: 0, y: 0 };
     if (node.positionAbsolute) return node.positionAbsolute;
     
     const parent = nodes.find(n => n.id === node.parentNode);
     const parentPos = getAbsolutePosition(parent);
     return {
        x: node.position.x + parentPos.x,
        y: node.position.y + parentPos.y,
     };
  }, [nodes]);

  // --- 2. NEW HANDLER: Capture state when drag starts ---
  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    dragRef.current = {
      id: node.id,
      position: node.position, // Save the valid relative position
      parentNode: node.parentNode // Save the valid parent
    };
  }, []);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
        if (node.type === 'vpc') return;

        const nodeAbs = getAbsolutePosition(node);
        const nodeCenter = {
            x: nodeAbs.x + (node.width || 0) / 2,
            y: nodeAbs.y + (node.height || 0) / 2,
        };

        const potentialParents = nodes.filter(
            (n) => (n.type === 'vpc' || n.type === 'subnet' || n.type === 'eks') && n.id !== node.id
        ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

        let newParent: Node | undefined = undefined;

        for (const parent of potentialParents) {
            const pAbs = getAbsolutePosition(parent);
            const pW = parent.width || parent.style?.width || 0;
            const pH = parent.height || parent.style?.height || 0;

            const isInside = 
                nodeCenter.x >= pAbs.x && 
                nodeCenter.x <= pAbs.x + Number(pW) &&
                nodeCenter.y >= pAbs.y && 
                nodeCenter.y <= pAbs.y + Number(pH);
            
            if (isInside) {
                if (node.type === 'service' && parent.type === 'subnet') { newParent = parent; break; }
                if (node.type === 'subnet' && parent.type === 'vpc') { newParent = parent; break; }
                if (node.type === 'eks' && parent.type === 'subnet') { newParent = parent; break; }
                if (node.type === 'eks-node-group' && parent.type === 'eks') { newParent = parent; break; }
            }
        }

        // --- VALIDATION & REVERT LOGIC ---
        const validation = validatePlacement(node, newParent);

        if (!validation.valid) {
            alert(`Invalid Move: ${validation.message}`);
            
            // 3. REVERT: If we have a stored valid state, go back to it
            if (dragRef.current && dragRef.current.id === node.id) {
                updateNode(node.id, {
                    position: dragRef.current.position, // Go back to old coordinates
                    parentNode: dragRef.current.parentNode, // Go back to old parent
                    extent: undefined // Ensure movement isn't locked weirdly
                });
            }
            return;
        }

        if (newParent) {
            if (node.parentNode !== newParent.id) {
                const pAbs = getAbsolutePosition(newParent);
                updateNode(node.id, {
                    parentNode: newParent.id,
                    position: {
                        x: nodeAbs.x - pAbs.x,
                        y: nodeAbs.y - pAbs.y
                    }
                });
            }
        } else {
            // Orphan Logic (check if allowed, e.g. S3)
            // If we moved out of a parent into whitespace, validation passed (e.g. S3)
            if (node.parentNode) {
                updateNode(node.id, {
                    parentNode: undefined,
                    position: nodeAbs 
                });
            }
        }
        
        // Clear ref
        dragRef.current = null;
    },
    [nodes, updateNode, getAbsolutePosition]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const mousePos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const isContainer = type === 'vpc' || type === 'subnet' || type === 'eks';
      let zIndex = Z_LAYERS.resource;
      let width = undefined;
      let height = undefined;

      if (type === 'vpc') {
        width = 500; height = 400; zIndex = Z_LAYERS.vpc;
      } else if (type === 'subnet') {
        width = 250; height = 180; zIndex = Z_LAYERS.subnet;
      } else if (type === 'eks') {
        width = 300; height = 200; zIndex = Z_LAYERS.eks;
      } 

      let defaultData: any = { 
        label: `New ${type}`, 
        type: type 
      };

      if (type === 'vpc') {
        defaultData = {
          ...defaultData,
          cidr: "10.0.0.0/16",
          enableDnsHostnames: true
        };
      } else if (type === 'subnet') {
        defaultData = {
          ...defaultData,
          cidr: "10.0.1.0/24",
          az: "us-east-1a",
          mapPublicIp: true
        };
      } else if (type === 'ec2') {
        defaultData = {
          ...defaultData,
          instanceType: "t3.micro",
          ami: "ubuntu-22.04"
        };
      } else if (type === 'rds') {
        defaultData = {
            ...defaultData,
            label: "my-db",
            engine: "mysql",
            instanceClass: "db.t3.micro",
            allocatedStorage: 20, // GB
            username: "admin"
        };
      
      // 🟢 ADD S3 DEFAULTS
      } else if (type === 's3') {
        defaultData = {
            ...defaultData,
            label: "my-app-bucket",
            versioning: false,
            forceDestroy: false
        };
      } else if (type === 'eks') {
        defaultData = {
            ...defaultData,
            label: "my-eks-cluster",
            version: "1.29"
        };
      } else if (type === 'eks-node-group') {
        defaultData = {
            ...defaultData,
            label: "workers",
            instanceTypes: ["t3.medium"],
            desiredSize: 2,
            minSize: 1,
            maxSize: 4
        };
      }

      // 2. Create Node with Defaults
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: isContainer ? type : 'service',
        position: mousePos, 
        data: defaultData, // <--- USE THE NEW DEFAULTS
        zIndex,
        style: { width, height },
        extent: undefined, 
        parentNode: undefined,
      };

      const potentialParents = nodes.filter(
        (n) => (n.type === 'vpc' || n.type === 'subnet' || n.type === 'eks')
      ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

      for (const parent of potentialParents) {
        const pAbs = getAbsolutePosition(parent);
        
        const pW = parent.width || parent.style?.width || 200; 
        const pH = parent.height || parent.style?.height || 150;

        const isInside = 
            mousePos.x >= pAbs.x && 
            mousePos.x <= pAbs.x + (Number(pW)) &&
            mousePos.y >= pAbs.y && 
            mousePos.y <= pAbs.y + (Number(pH));

        if (isInside) {
             let isValid = false;
             if (type === 'subnet' && parent.type === 'vpc') isValid = true;
             if (type === 'eks' && parent.type === 'subnet') isValid = true;
             if (type === 'eks-node-group' && parent.type === 'eks') isValid = true;
             if (!isContainer && parent.type === 'subnet') isValid = true;

             if (isValid) {
                 newNode.parentNode = parent.id;
                 newNode.extent = undefined;

                 newNode.position = {
                    x: mousePos.x - pAbs.x,
                    y: mousePos.y - pAbs.y,
                 };
                 break;
             }
        }
      }

      const parentNode = newNode.parentNode 
         ? nodes.find(n => n.id === newNode.parentNode) 
         : undefined;

      const validation = validatePlacement(newNode, parentNode);

      if (!validation.valid) {
          alert(`Cannot create resource here: ${validation.message}`);
          return;
      }

      addNode(newNode);
    },
    [screenToFlowPosition, nodes, addNode, getAbsolutePosition]
  );

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        className={isDark ? 'dark' : ''}
      >
        <Background gap={20} color={isDark ? '#334155' : '#e2e8f0'} />
        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-600 !shadow-md" />
        <MiniMap
          nodeColor={isDark ? '#475569' : '#e2e8f0'}
          maskColor={isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
          className="!bg-slate-100 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-600"
        />
      </ReactFlow>
      <TotalCostCard />
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}