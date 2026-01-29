'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { checkIn, confirmFoodReceived } from '@/lib/api'
import { CheckInTableGrid } from '@/components/CheckInTableGrid'
import { FoodQueueList } from '@/components/FoodQueueList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ArrowLeft, Camera, Loader2, CheckCircle, XCircle, ScanLine, Map, UtensilsCrossed, ListOrdered, LogOut } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Table, Booking } from '@/types/database'

const CHECKIN_AUTH_KEY = 'checkin_authenticated'

function getStoredAuth(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(CHECKIN_AUTH_KEY) === '1'
}

function setStoredAuth(ok: boolean) {
  if (typeof window === 'undefined') return
  if (ok) sessionStorage.setItem(CHECKIN_AUTH_KEY, '1')
  else sessionStorage.removeItem(CHECKIN_AUTH_KEY)
}

type TableWithBooking = Table & { current_booking?: Booking }
type CheckInResult = { ok: true; name: string; table: string } | { ok: false; message: string }

export default function CheckInPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    setAuthenticated(getStoredAuth())
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (loginUser === 'admin' && loginPass === 'admin') {
      setStoredAuth(true)
      setAuthenticated(true)
      setLoginUser('')
      setLoginPass('')
      toast.success('เข้าสู่ระบบแล้ว')
    } else {
      setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      toast.error('เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  const handleLogout = () => {
    setStoredAuth(false)
    setAuthenticated(false)
    toast.success('ออกจากระบบแล้ว')
  }

  const [tab, setTab] = useState<string>('scan')
  const [bookingId, setBookingId] = useState('')
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableWithBooking | null>(null)
  const [modalMapMode, setModalMapMode] = useState<'attendance' | 'food' | null>(null)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const performCheckInRef = useRef<(id: string) => void>(() => {})
  const queryClient = useQueryClient()

  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: (data) => {
      const name = data.user_name
      const table = data.table?.label ? `โต๊ะ ${data.table.label}` : `#${data.table_id}`
      setLastResult({ ok: true, name, table })
      toast.success('ลงทะเบียนเข้างานแล้ว', { description: `${name} · ${table}` })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setSelectedTable(null)
      setModalMapMode(null)
    },
    onError: (err: Error) => {
      setLastResult({ ok: false, message: err.message })
      toast.error(err.message)
    },
  })

  const foodMutation = useMutation({
    mutationFn: confirmFoodReceived,
    onSuccess: (data) => {
      const name = data.user_name
      const table = data.table?.label ? `โต๊ะ ${data.table.label}` : `#${data.table_id}`
      toast.success('ยืนยันการรับอาหารแล้ว', { description: `${name} · ${table} · จ่ายอาหารให้คนยกไปโต๊ะ` })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setSelectedTable(null)
      setModalMapMode(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const performCheckIn = useCallback(
    (id: string) => {
      const tid = id.trim()
      if (!tid) return
      setBookingId('')
      setLastResult(null)
      checkInMutation.mutate(tid)
    },
    [checkInMutation]
  )
  performCheckInRef.current = performCheckIn

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performCheckIn(bookingId)
  }

  const handleCameraToggle = useCallback(() => {
    if (cameraOpen) {
      const sc = scannerRef.current
      if (sc && typeof sc.stop === 'function') {
        sc.stop().catch(() => {})
        scannerRef.current = null
      }
      setCameraOpen(false)
      return
    }
    setLastResult(null)
    setCameraOpen(true)
  }, [cameraOpen])

  useEffect(() => {
    if (!cameraOpen) return
    let mounted = true
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mounted) return
      if (!document.getElementById('qr-reader')) return
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 8 },
          (decoded: string) => {
            scanner.stop().catch(() => {})
            scannerRef.current = null
            setCameraOpen(false)
            performCheckInRef.current(decoded.trim())
          },
          () => {}
        )
        .catch((err: Error) => {
          toast.error('เปิดกล้องไม่สำเร็จ: ' + (err.message || 'ไม่รองรับ'))
          setCameraOpen(false)
          scannerRef.current = null
        })
    })
    return () => {
      mounted = false
      const sc = scannerRef.current
      if (sc && typeof sc.stop === 'function') {
        sc.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [cameraOpen])

  const booking = selectedTable?.current_booking
  const canConfirmAttendance = booking?.status === 'APPROVED' && !booking?.checked_in_at
  // จ่ายอาหารได้เฉพาะเมื่อเข้างานแล้ว และยังไม่ได้รับอาหาร
  const canConfirmFood =
    booking?.status === 'APPROVED' && !!booking?.checked_in_at && !booking?.food_received_at

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto inline-flex p-3 bg-emerald-100 rounded-full mb-2">
              <ScanLine className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle>ลงทะเบียนเข้างาน / รับอาหาร</CardTitle>
            <CardDescription>กรุณาเข้าสู่ระบบเพื่อใช้งานหน้านี้</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-user">ชื่อผู้ใช้</Label>
                <Input
                  id="login-user"
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="username"
                  className="min-h-11"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pass">รหัสผ่าน</Label>
                <Input
                  id="login-pass"
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="password"
                  className="min-h-11"
                  autoComplete="current-password"
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600 font-medium">{loginError}</p>
              )}
              <Button type="submit" className="w-full min-h-11">
                เข้าสู่ระบบ
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="min-h-11">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="min-h-11 text-gray-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-2 sm:mb-3">
            <ScanLine className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">ลงทะเบียนเข้างาน / รับอาหาร</h1>
          <p className="text-sm text-gray-500 mt-1">สแกน QR · กรอกรหัส · หรือคลิกแผนผังโต๊ะ</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
            <TabsTrigger value="scan" className="gap-1 sm:gap-2">
              <ScanLine className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">สแกน QR / รหัส</span>
            </TabsTrigger>
            <TabsTrigger value="map-attendance" className="gap-1 sm:gap-2">
              <Map className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">แผนผัง เข้าร่วมงาน</span>
            </TabsTrigger>
            <TabsTrigger value="map-food" className="gap-1 sm:gap-2">
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">แผนผัง รับอาหาร</span>
            </TabsTrigger>
            <TabsTrigger value="queue-food" className="gap-1 sm:gap-2">
              <ListOrdered className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">คิว</span>
              <span className="hidden sm:inline">คิวโต๊ะรับอาหาร</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="w-5 h-5" />
                  สแกน QR / กรอกรหัส
                </CardTitle>
                <CardDescription>
                  ใช้กล้องสแกน QR บนตั๋ว หรือใช้เครื่องสแกนแบบพิมพ์รหัสใส่ช่องด้านล่าง
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="booking-id">รหัสการจอง (Booking ID)</Label>
                    <Input
                      id="booking-id"
                      type="text"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      placeholder="วางรหัสหรือพิมพ์จากเครื่องสแกน..."
                      className="min-h-12 text-base font-mono"
                      disabled={checkInMutation.isPending}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 min-h-12"
                      disabled={!bookingId.trim() || checkInMutation.isPending}
                    >
                      {checkInMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          กำลังลงทะเบียน...
                        </>
                      ) : (
                        'ลงทะเบียนเข้างาน'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant={cameraOpen ? 'destructive' : 'outline'}
                      className="min-h-12 shrink-0"
                      onClick={handleCameraToggle}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {cameraOpen ? 'ปิดกล้อง' : 'สแกน QR'}
                    </Button>
                  </div>
                </form>
                {cameraOpen && (
                  <div id="qr-reader" className="rounded-lg overflow-hidden border border-gray-200" />
                )}
                {lastResult && (
                  <div
                    className={`rounded-lg p-4 ${
                      lastResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {lastResult.ok ? (
                      <div className="flex items-center gap-3 text-green-800">
                        <CheckCircle className="w-8 h-8 shrink-0" />
                        <div className="text-left">
                          <p className="font-semibold">ลงทะเบียนเข้างานแล้ว</p>
                          <p className="text-sm">
                            {lastResult.name} · {lastResult.table}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-red-800">
                        <XCircle className="w-8 h-8 shrink-0" />
                        <div className="text-left">
                          <p className="font-semibold">ไม่สามารถลงทะเบียนได้</p>
                          <p className="text-sm">{lastResult.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map-attendance" className="mt-0">
            <div className="rounded-xl bg-white/90 shadow-md p-2 sm:p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>เช็คเข้าร่วมงาน:</strong> คลิกที่โต๊ะ → อ่านชื่อเพื่อยืนยัน → กด &quot;ยืนยัน เข้าร่วมงาน&quot;
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> จองแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500" /> เข้าร่วมงานแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-violet-500" /> รับอาหารแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-400" /> ว่าง
                </span>
              </div>
            </div>
            <div className="w-full max-w-[1100px] mx-auto aspect-[13/9] min-h-[280px] overflow-auto rounded-xl border border-gray-200 bg-white/95 shadow-inner">
              <CheckInTableGrid
                fitViewport
                onTableSelect={(t) => {
                  setSelectedTable(t)
                  setModalMapMode('attendance')
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="map-food" className="mt-0">
            <div className="rounded-xl bg-white/90 shadow-md p-2 sm:p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>เช็คการรับอาหาร:</strong> คลิกที่โต๊ะ → ฝ่ายบริการอ่านชื่อยืนยัน → กด &quot;ยืนยัน การรับอาหาร&quot;
                → จ่ายอาหารให้คนยกไปโต๊ะ (จ่ายได้เฉพาะโต๊ะที่<strong>เข้างานแล้ว</strong>)
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> จองแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500" /> เข้าร่วมงานแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-violet-500" /> รับอาหารแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-400" /> ว่าง
                </span>
              </div>
            </div>
            <div className="w-full max-w-[1100px] mx-auto aspect-[13/9] min-h-[280px] overflow-auto rounded-xl border border-gray-200 bg-white/95 shadow-inner">
              <CheckInTableGrid
                fitViewport
                onTableSelect={(t) => {
                  setSelectedTable(t)
                  setModalMapMode('food')
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="queue-food" className="mt-0">
            <FoodQueueList
              onTableSelect={(t) => {
                setSelectedTable(t)
                setModalMapMode('food')
              }}
            />
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/admin" className="text-blue-600 hover:underline">
            เข้า Admin
          </Link>
          {' · '}
          <Link href="/ticket" className="text-blue-600 hover:underline">
            ดูตั๋วของฉัน
          </Link>
        </p>
      </main>

      <Dialog
        open={!!selectedTable}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTable(null)
            setModalMapMode(null)
          }
        }}
      >
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>โต๊ะ {selectedTable?.label}</DialogTitle>
            <DialogDescription>
              {booking?.status === 'APPROVED'
                ? 'อ่านชื่อเพื่อยืนยัน แล้วกดปุ่มด้านล่าง'
                : !booking
                  ? 'ไม่มีผู้จอง'
                  : 'การจองยังไม่อนุมัติ'}
            </DialogDescription>
          </DialogHeader>
          {booking && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-gray-50 p-4 space-y-1">
                <p className="text-sm text-gray-500">ชื่อเจ้าของโต๊ะ</p>
                <p className="text-lg font-semibold text-gray-900">{booking.user_name}</p>
                <p className="text-sm text-gray-500">{booking.phone}</p>
              </div>
              {booking.checked_in_at && (
                <p className="text-sm text-blue-600 font-medium">✓ เข้าร่วมงานแล้ว</p>
              )}
              {booking.food_received_at && (
                <p className="text-sm text-violet-600 font-medium">✓ รับอาหารแล้ว</p>
              )}
              {modalMapMode === 'food' && booking && !booking.checked_in_at && !booking.food_received_at && (
                <p className="text-sm text-amber-600 font-medium">ต้องเข้างานก่อน จึงจะยืนยันการรับอาหารได้</p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {(modalMapMode === 'attendance' || modalMapMode === 'food') && (
                  <>
                    {modalMapMode === 'attendance' && (
                      <Button
                        className="w-full min-h-12"
                        disabled={!canConfirmAttendance || checkInMutation.isPending}
                        onClick={() => booking?.id && checkInMutation.mutate(booking.id)}
                      >
                        {checkInMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : canConfirmAttendance ? (
                          'ยืนยัน เข้าร่วมงาน'
                        ) : (
                          'เข้าร่วมงานแล้ว'
                        )}
                      </Button>
                    )}
                    {modalMapMode === 'food' && (
                      <Button
                        className="w-full min-h-12"
                        disabled={!canConfirmFood || foodMutation.isPending}
                        onClick={() => booking?.id && foodMutation.mutate(booking.id)}
                      >
                        {foodMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : canConfirmFood ? (
                          'ยืนยัน การรับอาหาร'
                        ) : booking?.food_received_at ? (
                          'รับอาหารแล้ว'
                        ) : (
                          'ต้องเข้างานก่อน'
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {!booking && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedTable(null)
                setModalMapMode(null)
              }}
            >
              ปิด
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
