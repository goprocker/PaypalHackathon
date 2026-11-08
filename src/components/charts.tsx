"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatInr } from "@/lib/truecost";

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#16A34A", Bills: "#1D4ED8", Shopping: "#D946EF", Food: "#F59E0B",
  Subscriptions: "#EF4444", Friends: "#06B6D4", Other: "#6B7280", Personal: "#7C3AED",
};

const tooltip = (v: unknown) => formatInr(Number(v));

export function CategoryDonut({ data }: { data: { category: string; paise: number }[] }) {
  const total = data.reduce((s, d) => s + d.paise, 0);
  const summary = data.map((d) => `${d.category} ${Math.round((d.paise / total) * 100)}%`).join(", ");
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0" role="img" aria-label={`Spending by category: ${summary}`}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="paise" nameKey="category" innerRadius="60%" outerRadius="100%" strokeWidth={2} isAnimationActive={false}>
              {data.map((d) => <Cell key={d.category} fill={CATEGORY_COLORS[d.category] ?? "#6B7280"} />)}
            </Pie>
            <Tooltip formatter={tooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1 text-sm">
        {data.map((d) => (
          <li key={d.category} className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-full" style={{ background: CATEGORY_COLORS[d.category] ?? "#6B7280" }} />
            <span className="flex-1">{d.category}</span>
            <span className="tabular text-muted">{Math.round((d.paise / total) * 100)}%</span>
            <span className="tabular w-20 text-right">{formatInr(d.paise)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MemberBars({ data }: { data: { name: string; paise: number }[] }) {
  const summary = data.map((d) => `${d.name} ${formatInr(d.paise)}`).join(", ");
  return (
    <div className="h-48" role="img" aria-label={`Spending by member: ${summary}`}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={70} tickLine={false} axisLine={false} />
          <Tooltip formatter={tooltip} cursor={{ fillOpacity: 0.1 }} />
          <Bar dataKey="paise" fill="var(--primary)" radius={[0, 8, 8, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
