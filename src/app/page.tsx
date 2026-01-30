'use client'

import { useState, useEffect } from 'react'
import { TableGrid } from '@/components/TableGrid'
import { BookingModal } from '@/components/BookingModal'
import type { Table } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Heart, Settings, Info, FileText, Ticket } from 'lucide-react'
import Link from 'next/link'
import { TABLE_BASE_PRICE } from '@/lib/constants'

export default function HomePage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const fn = () => setIsDesktop(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const handleCloseInfo = () => {
    setShowInfoPopup(false)
  }

  return (
    <div className={isDesktop ? 'h-dvh overflow-hidden flex flex-col' : 'min-h-screen relative flex flex-col'}>
      {/* Background Image with Opacity */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.85,
        }}
      />
      {/* Info Popup Dialog - mobile-first: full width on small screens */}
      <Dialog open={showInfoPopup} onOpenChange={setShowInfoPopup}>
        <DialogContent className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto rounded-2xl p-4 sm:max-w-md sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="w-5 h-5 text-blue-500" />
              วิธีการจองโต๊ะ
            </DialogTitle>
            <DialogDescription>
              กรุณาอ่านขั้นตอนก่อนทำการจอง
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>เลือกโต๊ะที่ว่าง (สีเขียว) จากผัง</li>
              <li>กรอกชื่อ-นามสกุล และเบอร์โทร</li>
              <li>สั่งเสื้อที่ระลึก (ไม่บังคับ) หรือขอใบ E Donation ได้ตามต้องการ</li>
              <li>ชำระเงินตามยอดรวม แล้วอัปโหลดสลิป</li>
              <li>รอการยืนยันจากผู้ดูแลระบบ</li>
            </ol>
            
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>หมายเหตุ:</strong> ราคาโต๊ะละ {TABLE_BASE_PRICE.toLocaleString()} บาท + บริจาคเพิ่มเติมได้
              </p>
            </div>
            
            <Button onClick={handleCloseInfo} className="w-full">
              OK เข้าใจแล้ว
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header - mobile-first: compact on small, expand on larger; shrink-0 on desktop single-page */}
      <header className={`bg-white/95 shadow-sm sticky top-0 z-10 backdrop-blur-sm ${isDesktop ? 'shrink-0' : ''}`}>
        <div className={`max-w-7xl mx-auto px-3 py-3 sm:px-4 ${isDesktop ? 'sm:py-3' : 'sm:py-6'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="shrink-0 p-1.5 sm:p-2 bg-rose-100 rounded-full">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-800 truncate sm:text-2xl">
                  คืนถิ่นชาพัฒนาบ้านเกิดครั้งที่ 10 พญาไพรโดม
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  ระบบจองโต๊ะงานเลี้ยงการกุศล
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Link href="/ticket">
                <Button variant="ghost" size="sm" className="h-10 min-w-10 px-2 sm:px-3 sm:min-w-0">
                  <Ticket className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">ดูตั๋วของฉัน</span>
                </Button>
              </Link>
              <Link href="/detail">
                <Button variant="ghost" size="sm" className="h-10 min-w-10 px-2 sm:px-3 sm:min-w-0">
                  <FileText className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">รายละเอียดของงาน</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="h-10 min-w-10 px-2 sm:px-3 sm:min-w-0" onClick={() => setShowInfoPopup(true)}>
                <Info className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">วิธีจอง</span>
              </Button>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="h-10 min-w-10 px-2 sm:px-3 sm:min-w-0">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - mobile-first: full width, compact padding */}
      <main className={`relative z-[1] flex flex-1 flex-col items-center px-2 sm:px-4 ${isDesktop ? 'min-h-0 overflow-hidden' : ''}`}>
        {/* Legend - stack on mobile, row on larger; compact on desktop for single-page */}
        <div className={`w-full max-w-4xl mx-auto shrink-0 ${isDesktop ? 'py-2' : 'py-3 sm:py-4'}`}>
          <div className={`flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 sm:justify-center items-center bg-white/90 backdrop-blur-sm rounded-xl shadow-md ${isDesktop ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}`}>
            <h2 className="w-full sm:w-auto text-center text-base sm:text-lg font-semibold text-gray-800">
              ผังโต๊ะ (117 โต๊ะ)
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setSelectedTable(null)
                setShowBookingModal(true)
              }}
            >
              ลงทะเบียน (ไม่จองโต๊ะ)
            </Button>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow" />
                <span className="text-sm font-medium">ว่าง</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-white shadow" />
                <span className="text-sm font-medium">รออนุมัติ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white shadow" />
                <span className="text-sm font-medium">จองแล้ว</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Table Grid - centered; on desktop fit viewport (เลื่อนได้ในกริดถ้าเต็ม แถว J ไม่หาย) */}
        <div className={`w-full max-w-7xl mx-auto ${isDesktop ? 'flex-1 min-h-0 flex items-center justify-center overflow-hidden pt-1 pb-2' : 'pt-1 pb-4 sm:pb-6'}`}>
          {isDesktop ? (
            <div className="h-full max-h-full w-full max-w-[1100px] aspect-[13/9] min-h-0 shrink-0 overflow-y-auto overflow-x-hidden">
              <TableGrid
                fitViewport
                onTableSelect={(t) => {
                  setSelectedTable(t)
                  setShowBookingModal(true)
                }}
              />
            </div>
          ) : (
            <TableGrid
              onTableSelect={(t) => {
                setSelectedTable(t)
                setShowBookingModal(true)
              }}
            />
          )}
        </div>
      </main>

      {/* Booking Modal - key forces re-mount when mode changes */}
      <BookingModal
        key={selectedTable?.id ?? 'no-table'}
        open={showBookingModal}
        table={selectedTable}
        onClose={() => {
          setShowBookingModal(false)
          setSelectedTable(null)
        }}
      />
    </div>
  )
}
