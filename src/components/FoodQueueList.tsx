'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchTables } from '@/lib/api'
import type { Table, Booking } from '@/types/database'
import { Loader2, UtensilsCrossed } from 'lucide-react'

type TableWithBooking = Table & { current_booking?: Booking }

interface FoodQueueListProps {
  onTableSelect: (table: TableWithBooking) => void
}

/** โต๊ะที่เข้างานแล้ว และยังไม่รับอาหาร เรียงจาก checked_in_at มาก่อนอยู่บน */
export function FoodQueueList({ onTableSelect }: FoodQueueListProps) {
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">กำลังโหลดคิว...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    )
  }

  const list = (tables as TableWithBooking[] || [])
    .filter((t) => {
      const b = t.current_booking
      return (
        b?.status === 'APPROVED' &&
        !!b?.checked_in_at &&
        !b?.food_received_at
      )
    })
    .sort((a, b) => {
      const at = a.current_booking?.checked_in_at ?? ''
      const bt = b.current_booking?.checked_in_at ?? ''
      return at.localeCompare(bt)
    })

  return (
    <div className="rounded-xl bg-white/90 shadow-md p-4">
      <p className="text-sm text-gray-600 mb-3">
        <strong>คิวโต๊ะรับอาหาร:</strong> โต๊ะที่เข้างานแล้ว เรียงตามลำดับมาก่อนอยู่บน
        · คลิกรหัสโต๊ะ → อ่านชื่อยืนยัน → กด &quot;ยืนยัน การรับอาหาร&quot;
      </p>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[160px] text-gray-500">
          <UtensilsCrossed className="w-10 h-10 mb-2 opacity-50" />
          <p className="font-medium">ยังไม่มีคิว</p>
          <p className="text-sm">เมื่อมีโต๊ะเข้างานแล้ว จะแสดงในคิวนี้</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-16">ลำดับ</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-24">รหัสโต๊ะ</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">ชื่อผู้จอง</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-32">เบอร์โทร</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t, i) => {
                const b = t.current_booking
                return (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onTableSelect(t)}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded px-1 -mx-1"
                      >
                        {t.label}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{b?.user_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{b?.phone ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
