import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EksClusterNode({ data, selected }: NodeProps) {
  return (
    <div className="relative h-full w-full">
      <NodeResizer
        color="#06b6d4"
        isVisible={selected}
        minWidth={250}
        minHeight={180}
      />
      <Card
        className={`
          h-full w-full bg-cyan-50/50 dark:bg-cyan-900/20 border-2 border-dashed
          ${selected ? "border-cyan-600 shadow-md" : "border-cyan-300 dark:border-cyan-700"}
          transition-all duration-200
        `}
      >
        {/* HEADER: Pointer Events AUTO (Clickable) */}
        <CardHeader className="p-2 pb-0 pointer-events-auto">
          <div className="flex justify-between items-center">
            <CardTitle className="text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-400">
              {data.label || "EKS Cluster"}
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[9px] h-4 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700"
            >
              {data.version || "1.28"}
            </Badge>
          </div>
        </CardHeader>

        {/* CONTENT: Pointer Events NONE (Click-through) */}
        <CardContent className="p-0 h-full pointer-events-none" />
      </Card>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3" />
    </div>
  );
}
