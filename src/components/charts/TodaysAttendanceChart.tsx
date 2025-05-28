
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer, LabelList } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { LegacyAttendanceRecord } from "@/types";

export interface AttendanceDataPoint {
  status: LegacyAttendanceRecord['status'];
  count: number;
  fill: string;
}

interface TodaysAttendanceChartProps {
  data: AttendanceDataPoint[];
}

const chartConfig = {
  count: {
    label: "Estudiantes",
  },
  Presente: {
    label: "Presente",
    color: "hsl(var(--chart-1))",
  },
  Ausente: {
    label: "Ausente",
    color: "hsl(var(--chart-2))",
  },
  Tardanza: {
    label: "Tardanza",
    color: "hsl(var(--chart-3))",
  },
  Justificado: {
    label: "Justificado",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export default function TodaysAttendanceChart({ data }: TodaysAttendanceChartProps) {
  if (!data || data.every(d => d.count === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay datos de asistencia para hoy.</p>;
  }
  
  const filteredData = data.filter(item => item.count > 0);

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[200px] w-full aspect-video"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={filteredData} 
          layout="vertical" 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis 
            dataKey="status" 
            type="category" 
            tickLine={false} 
            axisLine={false}
            stroke="hsl(var(--foreground))"
            tickMargin={8}
            width={80}
          />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent hideLabel />}
          />
          <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          <Bar dataKey="count" layout="vertical" radius={[0, 5, 5, 0]} barSize={35}>
            {filteredData.map((entry) => (
              <Cell key={`cell-${entry.status}`} fill={entry.fill} />
            ))}
             <LabelList 
                dataKey="count" 
                position="right" 
                offset={8} 
                className="fill-foreground" 
                fontSize={12} 
             />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

