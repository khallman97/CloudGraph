import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react"; // install lucide-react if missing, or use text

// Define what a rule looks like
interface Rule {
  port: number;
  cidr: string; // "0.0.0.0/0"
  protocol: string; // "tcp"
}

interface SecurityRulesProps {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
}

export function SecurityRules({ rules = [], onChange }: SecurityRulesProps) {
  const [port, setPort] = useState("22");
  
  const addRule = () => {
    const p = parseInt(port);
    if (!p) return;
    
    const newRule: Rule = { port: p, cidr: "0.0.0.0/0", protocol: "tcp" };
    onChange([...rules, newRule]);
  };

  const removeRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    onChange(newRules);
  };

  return (
    <div className="space-y-3 border rounded-md p-3 bg-slate-50">
      <Label className="text-xs font-semibold uppercase text-slate-500">Inbound Firewall Rules</Label>
      
      {/* List of existing rules */}
      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border text-xs">
            <span className="font-mono text-slate-600">TCP {rule.port}</span>
            <span className="text-slate-400 text-[10px]">{rule.cidr}</span>
            <button onClick={() => removeRule(idx)} className="text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        ))}
        {rules.length === 0 && <div className="text-xs text-muted-foreground italic">No ports open</div>}
      </div>

      {/* Add New Rule */}
      <div className="flex gap-2">
        <Input 
            value={port} 
            onChange={(e) => setPort(e.target.value)} 
            placeholder="Port (e.g. 22)" 
            className="h-8 text-xs bg-white"
            type="number"
        />
        <Button onClick={addRule} size="sm" variant="outline" className="h-8 px-2">
            <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}