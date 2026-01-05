import {
  SiAmazonec2,
  SiAmazons3,
  SiAmazonrds,
  SiAmazon,
  SiAmazoniam,
  SiAwselasticloadbalancing,
  SiKubernetes
} from "react-icons/si";
import { Boxes } from "lucide-react";

interface CloudIconProps {
  type: string;
  className?: string;
}

export function CloudIcon({ type, className = "w-10 h-10" }: CloudIconProps) {
  // Normalize type string to avoid case sensitivity issues
  const resourceType = type?.toLowerCase() || "";

  // 1. AWS MAPPING
  // This is where you would switch on 'provider' in the future
  if (resourceType.includes('ec2')) return <SiAmazonec2 className={`text-orange-500 ${className}`} />;
  if (resourceType.includes('s3')) return <SiAmazons3 className={`text-green-600 ${className}`} />;
  if (resourceType.includes('rds')) return <SiAmazonrds className={`text-blue-600 ${className}`} />;
  if (resourceType.includes('iam')) return <SiAmazoniam className={`text-red-600 ${className}`} />;
  if (resourceType.includes('load')) return <SiAwselasticloadbalancing className={`text-purple-600 ${className}`} />;
  if (resourceType.includes('eks-node-group') || resourceType.includes('nodegroup')) return <Boxes className={`text-indigo-600 ${className}`} />;
  if (resourceType.includes('eks') || resourceType.includes('k8s')) return <SiKubernetes className={`text-blue-500 ${className}`} />;
  
  // Default Fallback
  return <SiAmazon className={`text-slate-400 ${className}`} />;
}