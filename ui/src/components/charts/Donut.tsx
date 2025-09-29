// components/charts/DonutChart.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

type DataItem = {
  name: string
  value: number
}

const sampleData: DataItem[] = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
  { name: "Group D", value: 200 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DonutChart() {
  return (
    <div className="w-full min-h-20">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={sampleData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
          >
            {sampleData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
