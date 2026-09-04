import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function AttendanceChart({ data }: { data: { date: string; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#349563" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#349563" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(v: number) => [`${v}%`, 'Attendance']}
        />
        <Area type="monotone" dataKey="rate" stroke="#349563" strokeWidth={2} fill="url(#attendanceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
