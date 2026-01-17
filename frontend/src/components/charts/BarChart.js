'use client'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function BarChart({ data, dataKeys = [], colors = ['#2563eb', '#10b981'], height = 300, horizontal = false }) {
  const ChartComponent = RechartsBarChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} width={100} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          </>
        )}
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </ChartComponent>
    </ResponsiveContainer>
  )
}