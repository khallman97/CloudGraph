import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/app/store';

export function TotalCostCard() {
  const totalCost = useStore((state) => state.totalCost);

  return (
    <Card className="absolute top-4 right-4 z-50 min-w-[200px] shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 dark:text-white">
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          Estimated Cost
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          ${totalCost.toFixed(2)}
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/month</span>
        </div>
      </CardContent>
    </Card>
  );
}
