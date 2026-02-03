'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchTables } from '@/lib/api'
import type { Table, Booking } from '@/types/database'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

type TableWithBooking = Table & { current_booking?: Booking }

interface TableGridProps {
  onTableSelect: (table: Table) => void
  /** บน desktop: เติม container ที่มี aspect-ratio ให้พอดี viewport (ไม่ scroll แนวตั้ง) */
  fitViewport?: boolean
}

function getTableCursor(table: TableWithBooking): string {
  // จองแล้ว (BOOKED) = ไม่ให้คลิก
  if (table.status === 'BOOKED') return 'not-allowed'
  // รออนุมัติ (PENDING) = ให้คลิกเพื่อแก้ไข
  if (table.status === 'PENDING' || table.current_queue_count >= 1) return 'pointer'
  // ว่าง = ให้คลิกเพื่อจอง
  return 'pointer'
}

function getStatusColor(table: TableWithBooking): string {
  if (table.status === 'BOOKED') return 'bg-gray-500'
  if (table.status === 'PENDING' || table.current_queue_count >= 1) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getStatusText(table: TableWithBooking): string {
  if (table.status === 'BOOKED' && table.current_booking) {
    return table.current_booking.user_name
  }
  if (table.status === 'PENDING' || table.current_queue_count >= 1) {
    if (table.current_booking) {
      return table.current_booking.user_name
    }
    return 'รออนุมัติ'
  }
  return 'ว่าง'
}

function isTableAvailable(table: TableWithBooking): boolean {
  return table.status === 'AVAILABLE' && table.current_queue_count === 0
}

// โต๊ะที่คลิกได้ = ว่าง หรือ รออนุมัติ (PENDING)
function isTableClickable(table: TableWithBooking): boolean {
  // จองแล้ว (BOOKED) = ไม่ให้คลิก
  if (table.status === 'BOOKED') return false
  // รออนุมัติ (PENDING) = ให้คลิกเพื่อแก้ไข
  if (table.status === 'PENDING' || table.current_queue_count >= 1) return true
  // ว่าง = ให้คลิกเพื่อจอง
  return true
}

export function TableGrid({ onTableSelect, fitViewport }: TableGridProps) {
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

  // Group tables by row (A-I, 9 rows x 13 columns = 117 tables)
  const ROWS = 9
  const COLS = 13
  const rows: TableWithBooking[][] = []
  for (let i = 0; i < ROWS; i++) {
    rows.push((tables as TableWithBooking[])?.slice(i * COLS, (i + 1) * COLS) || [])
  }

  return (
    <div 
      className={`touch-manipulation ${fitViewport ? 'w-full min-h-full min-w-0 p-1 sm:p-2' : 'mx-auto p-1 sm:p-4'}`}
      style={fitViewport ? undefined : {
        width: 'min(98vw, 1100px)',
        maxWidth: '1100px',
        aspectRatio: '13/9',
      }}
    >
      {/* Grid Container - fits the concrete area */}
      <div className={cn('w-full h-full flex flex-col', fitViewport && 'min-h-0')}>
        {/* Column headers */}
        <div className="grid gap-0.5 sm:gap-1 mb-1" style={{ gridTemplateColumns: `auto repeat(${COLS}, 1fr)` }}>
          <div className="w-6 sm:w-8"></div>
          {Array.from({ length: COLS }, (_, i) => i + 1).map((col) => (
            <div key={col} className="text-center font-bold text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {col}
            </div>
          ))}
        </div>

        {/* Table grid - fills remaining space */}
        <div className={cn('flex-1 flex flex-col justify-between', fitViewport && 'min-h-0')}>
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid gap-0.5 sm:gap-1" style={{ gridTemplateColumns: `auto repeat(${COLS}, 1fr)` }}>
              {/* Row label */}
              <div className="flex items-center justify-center font-bold text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {String.fromCharCode(65 + rowIndex)}
              </div>
              
              {/* Tables in row */}
              {row.map((table) => {
                const clickable = isTableClickable(table)
                const available = isTableAvailable(table)
                
                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      if (clickable) {
                        onTableSelect(table)
                      }
                    }}
                    disabled={!clickable}
                    className={cn(
                      'relative group flex flex-col items-center justify-center transition-all duration-200 aspect-square min-w-0 touch-manipulation active:scale-105',
                      clickable ? 'hover:scale-110 hover:z-10 sm:hover:scale-110' : 'opacity-80'
                    )}
                    style={{ cursor: getTableCursor(table) }}
                  >
                    {/* Label - Top */}
                    <span className="text-[8px] sm:text-[10px] font-bold text-white mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {table.label}
                    </span>
                    
                    {/* Table Image with Status Circle */}
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
                      <Image
                        src="/tables.png"
                        alt={`Table ${table.label}`}
                        fill
                        className="object-contain drop-shadow-lg"
                      />
                      
                      {/* Status Circle - Centered, sized to fit white table center */}
                      <div className={cn(
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full shadow-md border-2 border-white/80',
                        getStatusColor(table)
                      )} />
                    </div>
                    
                    {/* Status Label - Always visible on hover */}
                    <div className={cn(
                      'absolute -bottom-4 left-1/2 -translate-x-1/2 text-white text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 max-w-[120px] truncate',
                      available ? 'bg-green-600' : table.status === 'BOOKED' ? 'bg-gray-600' : 'bg-yellow-600'
                    )}>
                      {available ? 'คลิกเพื่อจอง' : getStatusText(table)}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
