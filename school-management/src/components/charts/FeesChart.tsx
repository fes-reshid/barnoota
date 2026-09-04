import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#349563', '#fbbf24'];

export function FeesChart({ collected, outstanding }: { collected: number; outstanding: number }) {
  const data = [
    { name: 'Collected', value: collected },
    { name: 'Outstanding', value: outstanding },
  ];
  const total = collected + outstanding;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={2} stroke="none">
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(v: number) => `$${v.toLocaleString()}`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-slate-800">
          {total > 0 ? Math.round((collected / total) * 100) : 0}%
        </p>
        <p className="text-xs text-slate-500">collected</p>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Collected
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Outstanding
        </span>
      </div>
    </div>
  );
}
