
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface GradeCountBySubjectDataPoint {
  subject: string;
  count: number;
  fill: string;
}

interface GradeCountBySubjectChartProps {
  data: GradeCountBySubjectDataPoint[];
}

// Dynamically create chartConfig based on data
const createChartConfig = (data: GradeCountBySubjectDataPoint[]): ChartConfig => {
  const config: ChartConfig = {
    count: {
      label: "Notas",
    },
  };
  data.forEach(item => {
    config[item.subject.replace(/\s+/g, '')] = { // Sanitize subject name for key
      label: item.subject,
      color: item.fill,
    };
  });
  return config;
};

export default function GradeCountBySubjectChart({ data }: GradeCountBySubjectChartProps) {
  const chartConfig = React.useMemo(() => createChartConfig(data), [data]);
  
  const totalGrades = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  if (!data || data.every(d => d.count === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay notas registradas para mostrar.</p>;
  }
  
  const filteredData = data.filter(item => item.count > 0);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto flex aspect-square max-h-[300px] items-center justify-center relative" // Added relative for absolute positioning of total
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="subject" />}
          />
          <Pie
            data={filteredData}
            dataKey="count"
            nameKey="subject"
            innerRadius="60%" // Adjusted for better visual balance
            outerRadius="80%" // Adjusted
            strokeWidth={2} // Reduced stroke width
          >
            {filteredData.map((entry) => (
              <Cell key={entry.subject} fill={entry.fill} className="stroke-background hover:opacity-80" />
            ))}
          </Pie>
           <ChartLegend
            content={<ChartLegendContent nameKey="subject" />}
            className="-translate-y-2 flex-wrap gap-2 data-[legend=true]:flex"
          />
        </PieChart>
      </ResponsiveContainer>
       {totalGrades > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-foreground">{totalGrades}</p>
            <p className="text-xs text-muted-foreground">Total Notas</p>
          </div>
        )}
    </ChartContainer>
  )
}

