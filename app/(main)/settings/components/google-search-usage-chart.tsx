'use client'

import { Badge } from '@/components/ui/badge'
import { RadialBar, RadialBarChart, PolarRadiusAxis, Label, PolarGrid } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

interface GoogleSearchUsageChartProps {
  used: number
  limit: number
  status: 'active' | 'warning' | 'danger' | 'inactive'
}

export function GoogleSearchUsageChart({ used, limit, status }: GoogleSearchUsageChartProps) {
  const percentage = Math.min((used / limit) * 100, 100)
  
  const chartData = [{
    usage: percentage,
    fill: percentage > 90 ? "var(--color-danger)" : percentage > 75 ? "var(--color-warning)" : "var(--color-success)"
  }]

  const getStatusBadge = (status: GoogleSearchUsageChartProps['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
            正常
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <div className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
            注意
          </span>
        )
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
            <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
            警告
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <div className="h-1.5 w-1.5 bg-gray-400 rounded-full" />
            待機中
          </span>
        )
    }
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="mx-auto aspect-square max-h-[250px] w-full">
        <ChartContainer
          config={{
            usage: {
              label: "使用率",
            },
            success: {
              label: "正常",
              color: "hsl(142, 76%, 36%)",
            },
            warning: {
              label: "注意",
              color: "hsl(38, 92%, 50%)",
            },
            danger: {
              label: "危険",
              color: "hsl(0, 84%, 60%)",
            },
          }}
          className="h-full w-full"
        >
          <RadialBarChart
            data={chartData}
            width={250}
            height={250}
            startAngle={90}
            endAngle={90 + (percentage / 100) * 360}
            innerRadius={60}
            outerRadius={100}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[66, 54]}
            />
            <RadialBar 
              dataKey="usage" 
              background 
              cornerRadius={10}
              fill={chartData[0].fill}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan 
                          x={viewBox.cx} 
                          y={(viewBox.cy || 0) - 10} 
                          className="fill-foreground text-3xl font-bold"
                        >
                          {used.toLocaleString()}
                        </tspan>
                        <tspan 
                          x={viewBox.cx} 
                          y={(viewBox.cy || 0) + 10} 
                          className="fill-muted-foreground text-sm"
                        >
                          / {limit.toLocaleString()}
                        </tspan>
                        <tspan 
                          x={viewBox.cx} 
                          y={(viewBox.cy || 0) + 28} 
                          className="fill-muted-foreground text-xs"
                        >
                          API呼び出し
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </div>
      
      <div className="mt-4 space-y-3 w-full">
        <div className="flex justify-center">
          <Badge 
            variant={percentage > 90 ? "destructive" : percentage > 75 ? "secondary" : "default"}
            className="text-sm"
          >
            {percentage.toFixed(1)}% 使用中
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm px-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">残り使用可能:</span>
            <span className="font-medium">{(limit - used).toLocaleString()}回</span>
          </div>
          {getStatusBadge(status)}
        </div>
        
        {percentage > 90 && (
          <div className="flex items-center gap-2 text-destructive text-xs font-medium px-2">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            使用制限に近づいています。ご注意ください。
          </div>
        )}
      </div>
    </div>
  )
}