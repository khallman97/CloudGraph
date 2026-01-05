import { Handle, Position, type NodeProps } from 'reactflow';
import { CloudIcon } from './components/CloudIcon';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/app/store';

export function ServiceNode({ data, selected, id }: NodeProps) {
  const costBreakdown = useStore((state) => state.costBreakdown);
  const nodeCost = costBreakdown[id] || 0;

  return (
    // The "Group" container
    <div className={`
      relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
      ${selected ? "bg-blue-50/50 dark:bg-blue-900/30 ring-2 ring-blue-500 shadow-md" : "hover:bg-slate-100/50 dark:hover:bg-slate-700/50"}
    `}>

      {/* Cost Badge - positioned at top right */}
      {nodeCost > 0 && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            ${nodeCost.toFixed(2)}/mo
          </Badge>
        </div>
      )}

      {/* 1. The Icon (Dynamic) */}
      <div className="mb-2 p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-100 dark:border-slate-600">
         <CloudIcon type={data.type} className="w-8 h-8" />
      </div>

      {/* 2. The Label (Clean text below) */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            {data.type || "Service"}
        </span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate text-center leading-tight">
            {data.label}
        </span>
      </div>

      {/*
         3. Connection Handles
         We hide them (opacity-0) until you hover over the node to keep the UI clean
      */}
      <Handle
        type="target" position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target" position={Position.Left}
        className="!w-2 !h-2 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source" position={Position.Right}
        className="!w-2 !h-2 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source" position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}