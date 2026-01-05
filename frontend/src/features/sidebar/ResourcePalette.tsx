import { Cloud, Network, Server, Database, HardDrive, Container, Boxes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Define our available resources with icons
const RESOURCES = [
  {
    type: 'vpc',
    label: 'VPC Network',
    category: 'Network',
    icon: Cloud,
    color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-700',
    iconColor: 'text-blue-600 dark:text-blue-400',
    description: 'Virtual Private Cloud'
  },
  {
    type: 'subnet',
    label: 'Subnet',
    category: 'Network',
    icon: Network,
    color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900 hover:border-green-300 dark:hover:border-green-700',
    iconColor: 'text-green-600 dark:text-green-400',
    description: 'Network subnet'
  },
  {
    type: 'ec2',
    label: 'EC2 Instance',
    category: 'Compute',
    icon: Server,
    color: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900 hover:border-orange-300 dark:hover:border-orange-700',
    iconColor: 'text-orange-600 dark:text-orange-400',
    description: 'Virtual server'
  },
  {
    type: 'eks',
    label: 'EKS Cluster',
    category: 'Compute',
    icon: Container,
    color: 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900 hover:border-cyan-300 dark:hover:border-cyan-700',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    description: 'Kubernetes cluster'
  },
  {
    type: 'eks-node-group',
    label: 'Node Group',
    category: 'Compute',
    icon: Boxes,
    color: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-700',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    description: 'EKS worker nodes'
  },
  {
    type: 's3',
    label: 'S3 Bucket',
    category: 'Storage',
    icon: HardDrive,
    color: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:border-yellow-300 dark:hover:border-yellow-700',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    description: 'Object storage'
  },
  {
    type: 'rds',
    label: 'RDS Database',
    category: 'Storage',
    icon: Database,
    color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 hover:border-purple-300 dark:hover:border-purple-700',
    iconColor: 'text-purple-600 dark:text-purple-400',
    description: 'Managed database'
  },
];

export function ResourcePalette() {

  // This function attaches the data to the drag event
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-64 h-full border-r rounded-none bg-background flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
        <h2 className="font-semibold tracking-tight text-slate-900 dark:text-white">AWS Resources</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Drag onto canvas</p>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">

          {/* Network Category */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">Network</h3>
            {RESOURCES.filter(r => r.category === 'Network').map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.type}
                  className={`p-3 border-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 group ${res.color}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, res.type)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md bg-white/80 dark:bg-slate-800/80 ${res.iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white">{res.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{res.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Compute Category */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">Compute</h3>
             {RESOURCES.filter(r => r.category === 'Compute').map((res) => {
               const Icon = res.icon;
               return (
                 <div
                   key={res.type}
                   className={`p-3 border-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 group ${res.color}`}
                   draggable
                   onDragStart={(e) => onDragStart(e, res.type)}
                 >
                   <div className="flex items-start gap-3">
                     <div className={`p-2 rounded-md bg-white/80 dark:bg-slate-800/80 ${res.iconColor}`}>
                       <Icon className="h-4 w-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white">{res.label}</div>
                       <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{res.description}</div>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>

          <Separator />

          {/* Storage Category */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">Storage</h3>
             {RESOURCES.filter(r => r.category === 'Storage').map((res) => {
               const Icon = res.icon;
               return (
                 <div
                   key={res.type}
                   className={`p-3 border-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 group ${res.color}`}
                   draggable
                   onDragStart={(e) => onDragStart(e, res.type)}
                 >
                   <div className="flex items-start gap-3">
                     <div className={`p-2 rounded-md bg-white/80 dark:bg-slate-800/80 ${res.iconColor}`}>
                       <Icon className="h-4 w-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white">{res.label}</div>
                       <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{res.description}</div>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>

        </div>
      </ScrollArea>
    </Card>
  );
}