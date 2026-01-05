import { Handle, Position, type NodeProps, NodeResizer  } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VpcNode({ data, selected }: NodeProps) {
  return (
    <div className="relative h-full w-full">
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={300}
        minHeight={200}
      />
      <Card
        className={`
          h-full w-full bg-slate-50/50 dark:bg-slate-800/50 border-2 border-dashed
          ${selected ? "border-blue-500 shadow-md" : "border-slate-300 dark:border-slate-600"}
          transition-all duration-200
        `}
      >

        {/* HEADER: Pointer Events AUTO (Clickable) */}
        <CardHeader className="p-2 pb-0 pointer-events-auto">
            <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      {data.label || "VPC Network"}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] h-5 dark:border-slate-500 dark:text-slate-300">
                    {data.cidr || "10.0.0.0/16"}
                </Badge>
            </div>
        </CardHeader>

        {/* CONTENT: Pointer Events NONE (Click-through) */}
        <CardContent className="p-0 h-full pointer-events-none" />
      </Card>

      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
}