import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SubnetNode({ data, selected }: NodeProps) {
  return (
    <div className="relative h-full w-full">
        <NodeResizer
        color="#22c55e"
        isVisible={selected}
        minWidth={200}
        minHeight={200}
      />
      <Card
        className={`
          h-full w-full bg-green-50/50 dark:bg-green-900/20 border-2 border-dashed
          ${selected ? "border-green-600 shadow-md" : "border-green-300 dark:border-green-700"}
          transition-all duration-200
        `}
      >
        <CardHeader className="p-2 pb-0 pointer-events-auto">
            <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400">
                     {data.label || "Subnet"}
                </CardTitle>
                <Badge variant="outline" className="text-[9px] h-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700">
                    {data.cidr || "10.0.1.0/24"}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="p-0 pointer-events-none" />
      </Card>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="!bg-green-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-green-500 !w-2 !h-2" />
    </div>
  );
}