'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ApiUsageChartProps {
  data: {
    date: string
    count: number
  }[]
}

export function ApiUsageChart({ data }: ApiUsageChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(new Date(item.date), 'M/d', { locale: ja })
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>API使用状況（過去7日間）</CardTitle>
        <CardDescription>
          Google Custom Search APIの使用回数
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="displayDate" 
                stroke="#e5e7eb"
                tick={{ 
                  fill: '#6b7280',
                  fontSize: 12
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ 
                  value: '日付', 
                  position: 'insideBottom', 
                  offset: -5,
                  style: { 
                    textAnchor: 'middle',
                    fill: '#6b7280',
                    fontSize: 12
                  }
                }}
              />
              <YAxis 
                stroke="#e5e7eb"
                tick={{ 
                  fill: '#6b7280',
                  fontSize: 12
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ 
                  value: 'API呼び出し回数', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { 
                    textAnchor: 'middle',
                    fill: '#6b7280',
                    fontSize: 12
                  }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                labelStyle={{ 
                  color: 'hsl(var(--popover-foreground))',
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: 'hsl(var(--popover-foreground))'
                }}
                formatter={(value) => [`${value}回`, 'API呼び出し']}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorApi)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface ApiUsageByPatternChartProps {
  data: {
    pattern_name: string
    count: number
  }[]
}

export function ApiUsageByPatternChart({ data }: ApiUsageByPatternChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>検索パターン別使用回数</CardTitle>
        <CardDescription>
          最も使用されている検索パターントップ5
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="pattern_name"
                stroke="#e5e7eb"
                tick={{ 
                  fill: '#6b7280',
                  fontSize: 11
                }}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#e5e7eb"
                tick={{ 
                  fill: '#6b7280',
                  fontSize: 12
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ 
                  value: '使用回数', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { 
                    textAnchor: 'middle',
                    fill: '#6b7280',
                    fontSize: 12
                  }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                labelStyle={{ 
                  color: 'hsl(var(--popover-foreground))',
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: 'hsl(var(--popover-foreground))'
                }}
                formatter={(value) => `${value}回`}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar 
                dataKey="count" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}