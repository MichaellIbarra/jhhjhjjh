
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface StudentsPerGradeDataPoint {
  grade: string;
  count: number;
  fill: string;
}

interface StudentsPerGradeChartProps {
  data: StudentsPerGradeDataPoint[];
}

// Dynamically create chartConfig based on data
const createChartConfig = (data: StudentsPerGradeDataPoint[]): ChartConfig => {
  const config: ChartConfig = {
    count: {
      label: "Estudiantes",
    },
  };
  data.forEach(item => {
    config[item.grade] = {
      label: item.grade,
      color: item.fill,
    };
  });
  return config;
};

export default function StudentsPerGradeChart({ data }: StudentsPerGradeChartProps) {
  const chartConfig = React.useMemo(() => createChartConfig(data), [data]);
  
  const chartData = data.map(item => ({
    name: item.grade, // Use 'name' for YAxis dataKey if type is category
    count: item.count,
    fill: item.fill,
  }));

  if (!data || data.every(d => d.count === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay datos de estudiantes por grado para mostrar.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            type="category" 
            tickLine={false} 
            axisLine={false}
            tickMargin={8}
            interval={0}
          />
          <YAxis type="number" dataKey="count" allowDecimals={false} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          {/* 
            If you want a legend, it would typically be for multiple bars per category (e.g. stacked/grouped).
            For a single bar per grade, a legend might be redundant if colors are distinct enough or labels are clear.
            <ChartLegend content={<ChartLegendContent />} /> 
          */}
          <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={40}>
            {chartData.map((entry, index) => (
              <rect key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList dataKey="count" position="top" offset={5} className="fill-foreground" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
