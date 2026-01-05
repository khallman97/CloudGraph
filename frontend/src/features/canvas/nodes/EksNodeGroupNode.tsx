import { Handle, Position, type NodeProps } from 'reactflow';
import { CloudIcon } from './components/CloudIcon';
import { Badge } from '@/components/ui/badge';

export function EksNodeGroupNode({ data, selected }: NodeProps) {
  return (
    <div className={`
      relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
      ${selected ? "bg-cyan-50/50 dark:bg-cyan-900/30 ring-2 ring-cyan-500 shadow-md" : "hover:bg-slate-100/50 dark:hover:bg-slate-700/50"}
    `}>

      {/* 1. The Icon (Kubernetes) */}
      <div className="mb-2 p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-100 dark:border-slate-600">
        <CloudIcon type="eks" className="w-8 h-8" />
      </div>

      {/* 2. The Label and Metadata */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          NODE GROUP
        </span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate text-center leading-tight">
          {data.label || "Node Group"}
        </span>

        {/* Instance Count Badge */}
        {data.desiredSize && (
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700"
          >
            {data.desiredSize} nodes
          </Badge>
        )}

        {/* Instance Type Badge */}
        {data.instanceType && (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0.5 text-slate-600 dark:text-slate-300"
          >
            {data.instanceType}
          </Badge>
        )}
      </div>

      {/* 3. Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
