import React, { useEffect, useState } from 'react'
import api from '../../api'

export default function AdminAnnouncements(){
  const [list, setList] = useState([])
  useEffect(()=>{ api.get('/admin/announcements').then(r=>setList(r.data)) },[])
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Announcements</h2>
      <div className="space-y-2">
        {list.map(a=> (
          <div key={a.id} className="p-3 bg-white rounded shadow-sm">
            <div className="font-semibold">{a.title}</div>
            <div className="text-sm text-gray-600">{a.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
