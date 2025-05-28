
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface StudentLevelDataPoint {
  level: 'Inicial' | 'Primaria' | 'Secundaria';
  count: number;
  fill: string;
}

interface StudentLevelDistributionChartProps {
  data: StudentLevelDataPoint[];
}

const chartConfig = {
  count: {
    label: "Estudiantes",
  },
  inicial: {
    label: "Inicial",
    color: "hsl(var(--chart-1))",
  },
  primaria: {
    label: "Primaria",
    color: "hsl(var(--chart-2))",
  },
  secundaria: {
    label: "Secundaria",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function StudentLevelDistributionChart({ data }: StudentLevelDistributionChartProps) {
  const chartData = data.map(item => ({
    level: item.level,
    [item.level.toLowerCase()]: item.count, // Use lowercase level as key for Recharts dataKey
  }));
  
  // We need to ensure all keys from chartConfig are present in each data point for the BarChart,
  // or structure the bars differently. For simplicity with stacked/grouped bars,
  // it's often easier if each data point object has all possible keys.
  // However, for a simple bar chart with one bar per level, we can map directly.
  const singleBarData = data.map(item => ({
    name: item.level,
    count: item.count,
    fill: item.fill,
  }));


  if (!data || data.every(d => d.count === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay datos de estudiantes para mostrar en el gráfico.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={singleBarData} layout="vertical" margin={{ right: 20, left:10 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" dataKey="count" allowDecimals={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            tickLine={false} 
            axisLine={false}
            tickMargin={8}
            width={80}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
           <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="count" radius={5} barSize={40}>
            {singleBarData.map((entry, index) => (
              <React.Fragment key={`cell-${index}`}>
                 {/* @ts-ignore TODO: Check if Recharts.Cell is the correct type here or if fill should be on Bar itself */}
                <rect fill={entry.fill} />
              </React.Fragment>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
