'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchTables } from '@/lib/api'
import type { Table, Booking } from '@/types/database'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

type TableWithBooking = Table & { current_booking?: Booking }

interface CheckInTableGridProps {
  onTableSelect: (table: TableWithBooking) => void
  /** บน desktop: เติม container ที่มี aspect-ratio ให้พอดี viewport */
  fitViewport?: boolean
}

function getCheckInColor(table: TableWithBooking): string {
  const b = table.current_booking
  if (!b || (b.status !== 'APPROVED' && b.status !== 'PENDING_VERIFICATION')) return 'bg-gray-400'
  if (b.food_received_at) return 'bg-violet-500'
  if (b.checked_in_at) return 'bg-blue-500'
  if (b.status === 'PENDING_VERIFICATION') return 'bg-yellow-500'
  return 'bg-amber-500'
}

function getCheckInLabel(table: TableWithBooking): string {
  const b = table.current_booking
  if (!b) return 'ว่าง'
  if (b.food_received_at) return 'รับอาหารแล้ว'
  if (b.checked_in_at) return 'เข้าร่วมงานแล้ว'
  return b.user_name || 'จองแล้ว'
}

export function CheckInTableGrid({ onTableSelect, fitViewport }: CheckInTableGridProps) {
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลด...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    )
  }

  const ROWS = 9
  const COLS = 13
  const rows: TableWithBooking[][] = []
  for (let i = 0; i < ROWS; i++) {
    rows.push((tables as TableWithBooking[])?.slice(i * COLS, (i + 1) * COLS) || [])
  }

  return (
    <div
      className={cn(
        'touch-manipulation',
        fitViewport ? 'w-full min-h-full min-w-0 p-1 sm:p-2' : 'mx-auto p-1 sm:p-4'
      )}
      style={
        fitViewport
          ? undefined
          : { width: 'min(98vw, 1100px)', maxWidth: '1100px', aspectRatio: '13/9' }
      }
    >
      <div className={cn('w-full h-full flex flex-col', fitViewport && 'min-h-0')}>
        <div
          className="grid gap-0.5 sm:gap-1 mb-1"
          style={{ gridTemplateColumns: `auto repeat(${COLS}, 1fr)` }}
        >
          <div className="w-6 sm:w-8" />
          {Array.from({ length: COLS }, (_, i) => i + 1).map((col) => (
            <div
              key={col}
              className="text-center font-bold text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              {col}
            </div>
          ))}
        </div>
        <div className={cn('flex-1 flex flex-col justify-between', fitViewport && 'min-h-0')}>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-0.5 sm:gap-1"
              style={{ gridTemplateColumns: `auto repeat(${COLS}, 1fr)` }}
            >
              <div className="flex items-center justify-center font-bold text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {String.fromCharCode(65 + rowIndex)}
              </div>
              {row.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onTableSelect(table)}
                  className="relative group flex flex-col items-center justify-center transition-all duration-200 aspect-square min-w-0 touch-manipulation active:scale-105 hover:scale-110 hover:z-10 sm:hover:scale-110 cursor-pointer"
                >
                  <span className="text-[8px] sm:text-[10px] font-bold text-white mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {table.label}
                  </span>
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
                    <Image
                      src="/tables.png"
                      alt={`Table ${table.label}`}
                      fill
                      className="object-contain drop-shadow-lg"
                    />
                    <div
                      className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full shadow-md border-2 border-white/80',
                        getCheckInColor(table)
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      'absolute -bottom-4 left-1/2 -translate-x-1/2 text-white text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 max-w-[120px] truncate',
                      table.current_booking?.food_received_at
                        ? 'bg-violet-600'
                        : table.current_booking?.checked_in_at
                          ? 'bg-blue-600'
                          : table.current_booking
                            ? 'bg-amber-600'
                            : 'bg-gray-500'
                    )}
                  >
                    {getCheckInLabel(table)}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
