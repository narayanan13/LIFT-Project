import React, { useEffect, useState } from 'react'
import api from '../../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function AlumniReports(){
  const [report, setReport] = useState(null)
  useEffect(()=>{ api.get('/admin/report/budget').then(r=>setReport(r.data)).catch(()=>{}) },[])
  const data = (report?.byCategory || []).map(c=> ({ name: c.category, value: c._sum.amount || 0 }))
  const COLORS = ['#6366F1','#EF4444','#10B981','#F59E0B','#06B6D4','#8B5CF6']
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Expense Breakdown</h2>
      <div style={{ height: 300 }} className="bg-white p-4 rounded shadow-sm">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
              {data.map((d,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
