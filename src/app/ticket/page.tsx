'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchBookingsByPhone } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Ticket, Loader2, Download, Phone } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import type { Booking } from '@/types/database'

const EVENT_NAME = 'คืนถิ่นชาพัฒนาบ้านเกิดครั้งที่ 10 พญาไพรโดม'
const LOGO_PATH = '/BackDrop2.png'

export default function TicketPage() {
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['ticket-by-phone', phone],
    queryFn: () => fetchBookingsByPhone(phone),
    enabled: submitted && phone.replace(/\D/g, '').length >= 9,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (!digits || digits.length < 9) {
      toast.error('กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก')
      return
    }
    setSubmitted(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const normalizedPhone = phone.replace(/\D/g, '')
  const showForm = !submitted || (submitted && normalizedPhone.length < 9)
  const hasResult = submitted && normalizedPhone.length >= 9 && !isLoading
  const noBookings = hasResult && bookings.length === 0
  const hasBookings = hasResult && bookings.length > 0

  const userName = hasBookings && bookings[0] ? bookings[0].user_name : ''
  const tableCodes = (hasBookings ? bookings : [])
    .map((b: Booking) => b.table?.label)
    .filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ticket-print-area, #ticket-print-area * { visibility: visible; }
          #ticket-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="no-print bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="min-h-11">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าจอง
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-6 sm:px-4 sm:py-8 no-print">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-rose-100 rounded-full mb-3">
            <Ticket className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">ดูตั๋วของฉัน</h1>
          <p className="text-sm text-gray-500 mt-1">
            กรอกเบอร์โทรที่ใช้จองเพื่อดูและดาวน์โหลดตั๋ว (เจ้าของเท่านั้น)
          </p>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                เบอร์โทร (รหัสผ่าน)
              </CardTitle>
              <CardDescription>
                เบอร์โทรที่ใช้ลงทะเบียนจองโต๊ะ – ใช้เป็นรหัสเพื่อเข้าดูตั๋ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="0812345678"
                    className="min-h-12 text-base"
                  />
                </div>
                <Button type="submit" className="w-full min-h-12" disabled={!phone.replace(/\D/g, '').trim()}>
                  เข้าดูตั๋ว
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <p className="text-gray-500">กำลังตรวจสอบ...</p>
          </div>
        )}

        {error && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-6 text-center">
              <p className="text-amber-800 font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-amber-700 mt-1">{(error as Error).message}</p>
              <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                กรอกใหม่อีกครั้ง
              </Button>
            </CardContent>
          </Card>
        )}

        {noBookings && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-8 text-center">
              <p className="text-amber-800 font-medium">ไม่พบการจองที่อนุมัติแล้วด้วยเบอร์นี้</p>
              <p className="text-sm text-amber-700 mt-1">
                กรุณากรอกเบอร์โทรที่ใช้จอง และรอการอนุมัติจากผู้ดูแลก่อนดูตั๋ว
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                กรอกเบอร์ใหม่อีกครั้ง
              </Button>
            </CardContent>
          </Card>
        )}

        {hasBookings && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handlePrint} className="flex-1 min-h-12" size="lg">
                <Download className="w-5 h-5 mr-2" />
                พิมพ์ / บันทึกเป็น PDF
              </Button>
              <Button variant="outline" className="min-h-12" onClick={() => { setSubmitted(false); setPhone('') }}>
                ออกจากตั๋ว
              </Button>
            </div>
            <p className="text-sm text-gray-500 text-center">กดปุ่มด้านบนเพื่อพิมพ์หรือบันทึกตั๋วเป็น PDF</p>
          </div>
        )}
      </main>

      {/* Printable ticket – hidden on screen when no-print hides main; always included for print */}
      {hasBookings && (
        <div id="ticket-print-area" className="mx-auto p-6 sm:p-8 max-w-lg hidden print:block">
          <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src={LOGO_PATH}
                  alt="Logo"
                  width={200}
                  height={120}
                  className="object-contain max-h-28 w-auto"
                />
              </div>
              <h2 className="text-lg font-bold text-gray-800">{EVENT_NAME}</h2>
              <p className="text-sm text-gray-500">ตั๋วเข้างาน</p>
              <div className="border-t border-b border-gray-200 py-4 space-y-1">
                <p className="text-base font-semibold">{userName}</p>
                <p className="text-2xl font-bold text-rose-600">
                  โต๊ะ {tableCodes.join(', ')}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {bookings.map((b: Booking) => (
                  <div key={b.id} className="inline-flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <QRCode value={b.id} size={100} level="M" />
                    </div>
                    {b.table?.label && (
                      <p className="text-xs font-medium text-gray-600 mt-1">โต๊ะ {b.table.label}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">สแกน QR เพื่อลงทะเบียนเข้างาน · กรุณานำตั๋วนี้มาแสดงหน้างาน</p>
            </div>
          </div>
        </div>
      )}

      {/* Same ticket visible on screen for preview (not hidden), when hasBookings */}
      {hasBookings && (
        <div className="max-w-2xl mx-auto px-3 pb-12 no-print">
          <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-lg overflow-hidden max-w-lg mx-auto">
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src={LOGO_PATH}
                  alt="Logo"
                  width={200}
                  height={120}
                  className="object-contain max-h-28 w-auto"
                />
              </div>
              <h2 className="text-lg font-bold text-gray-800">{EVENT_NAME}</h2>
              <p className="text-sm text-gray-500">ตั๋วเข้างาน</p>
              <div className="border-t border-b border-gray-200 py-4 space-y-1">
                <p className="text-base font-semibold">{userName}</p>
                <p className="text-2xl font-bold text-rose-600">
                  โต๊ะ {tableCodes.join(', ')}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {bookings.map((b: Booking) => (
                  <div key={b.id} className="inline-flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <QRCode value={b.id} size={100} level="M" />
                    </div>
                    {b.table?.label && (
                      <p className="text-xs font-medium text-gray-600 mt-1">โต๊ะ {b.table.label}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">สแกน QR เพื่อลงทะเบียนเข้างาน · กด &quot;พิมพ์ / บันทึกเป็น PDF&quot; เพื่อดาวน์โหลด</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
