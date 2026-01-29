'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPendingBookings, fetchAllBookings, approveBooking, rejectBooking, updateBookingMemo, fetchRegistrations } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import type { Booking, Registration } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, Check, X, Eye, Clock, CheckCircle, XCircle, AlertCircle, Ban, MessageSquare, Save } from 'lucide-react'
import Image from 'next/image'

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_VERIFICATION':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />รอตรวจสอบ</Badge>
    case 'APPROVED':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>
    case 'REJECTED':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />ปฏิเสธ</Badge>
    case 'WAITING_LIST':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><AlertCircle className="w-3 h-3 mr-1" />คิวสำรอง</Badge>
    case 'CANCELLED_BY_SYSTEM':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300"><Ban className="w-3 h-3 mr-1" />ยกเลิกโดยระบบ</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminDashboard() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [memo, setMemo] = useState('')
  const [isMemoEdited, setIsMemoEdited] = useState(false)
  const queryClient = useQueryClient()

  // Update memo state when selected booking changes
  useEffect(() => {
    if (selectedBooking) {
      setMemo(selectedBooking.memo || '')
      setIsMemoEdited(false)
    }
  }, [selectedBooking])

  const { data: pendingBookings, isLoading: isPendingLoading } = useQuery({
    queryKey: ['bookings', 'pending'],
    queryFn: fetchPendingBookings,
  })

  const { data: allBookings, isLoading: isAllLoading } = useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: fetchAllBookings,
  })

  const { data: registrations = [], isLoading: isRegLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: fetchRegistrations,
  })

  const approveMutation = useMutation({
    mutationFn: approveBooking,
    onSuccess: () => {
      toast.success('อนุมัติการจองสำเร็จ!')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setSelectedBooking(null)
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectBooking,
    onSuccess: () => {
      toast.success('ปฏิเสธการจองแล้ว คิวถูกเลื่อนขึ้น')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setSelectedBooking(null)
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
  })

  const memoMutation = useMutation({
    mutationFn: ({ bookingId, memo }: { bookingId: string; memo: string }) => 
      updateBookingMemo(bookingId, memo),
    onSuccess: () => {
      toast.success('บันทึก Memo สำเร็จ!')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setIsMemoEdited(false)
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
  })

  const handleSaveMemo = () => {
    if (selectedBooking) {
      memoMutation.mutate({ bookingId: selectedBooking.id, memo })
    }
  }

  const BookingCard = ({ booking, showActions = false }: { booking: Booking; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">โต๊ะ {booking.table?.label || `#${booking.table_id}`}</span>
              {getStatusBadge(booking.status)}
              {booking.memo && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  มี Memo
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{booking.user_name}</p>
            <p className="text-sm text-gray-500">{booking.phone}</p>
            <p className="text-sm font-medium text-primary">{booking.amount.toLocaleString()} บาท</p>
            <p className="text-xs text-gray-400">{formatDate(booking.created_at)}</p>
            <p className="text-xs text-gray-500">คิว #{booking.queue_position}</p>
            {booking.memo && (
              <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded mt-2 line-clamp-2">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                {booking.memo}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBooking(booking)}
            >
              <Eye className="w-4 h-4 mr-1" />
              ดูสลิป
            </Button>
            {showActions && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate(booking.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      อนุมัติ
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectMutation.mutate(booking.id)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      ปฏิเสธ
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Badge variant="outline" className="text-lg px-4 py-1">
          รอตรวจสอบ: {pendingBookings?.length || 0} รายการ
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            รอตรวจสอบ ({pendingBookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            ทั้งหมด ({allBookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="registrations" className="gap-2">
            ลงทะเบียนไม่จอง ({registrations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isPendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingBookings?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-gray-500">ไม่มีรายการรอตรวจสอบ</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingBookings?.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {isAllLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allBookings?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">ยังไม่มีการจอง</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {allBookings?.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registrations" className="mt-4">
          {isRegLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : registrations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">ยังไม่มีรายการลงทะเบียนแบบไม่จองโต๊ะ</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-amber-900 mb-3">สรุปรวม (ลงทะเบียนไม่จองโต๊ะ)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-amber-700">จำนวนคน</p>
                      <p className="font-bold text-lg">{registrations.length} คน</p>
                    </div>
                    <div>
                      <p className="text-amber-700">ยอดบริจาครวม</p>
                      <p className="font-bold text-lg">
                        {registrations.reduce((s, r) => s + (r.donation || 0), 0).toLocaleString()} บาท
                      </p>
                    </div>
                    <div>
                      <p className="text-amber-700">ยอดรวมทั้งหมด</p>
                      <p className="font-bold text-lg text-primary">
                        {registrations.reduce((s, r) => s + (r.total_amount || 0), 0).toLocaleString()} บาท
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4">
                {registrations.map((reg: Registration) => (
                  <Card key={reg.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 min-w-0">
                          <p className="font-medium">{reg.user_name}</p>
                          <p className="text-sm text-gray-500">{reg.phone}</p>
                          <p className="text-sm">
                            บริจาค <span className="font-medium">{reg.donation.toLocaleString()}</span> บาท
                            {reg.shirt_orders?.length ? (
                              <span> · เสื้อ {reg.shirt_orders.reduce((s, o) => s + o.quantity, 0)} ตัว</span>
                            ) : null}
                          </p>
                          <p className="text-primary font-semibold">{reg.total_amount.toLocaleString()} บาท</p>
                          <p className="text-xs text-gray-400">{formatDate(reg.created_at)}</p>
                          {reg.e_donation_want && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                              ขอ E-Donation
                            </Badge>
                          )}
                        </div>
                        {reg.slip_url && (
                          <a
                            href={reg.slip_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline shrink-0"
                          >
                            ดูสลิป
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Slip Preview Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดการจอง</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">โต๊ะ</p>
                  <p className="font-medium">{selectedBooking.table?.label || `#${selectedBooking.table_id}`}</p>
                </div>
                <div>
                  <p className="text-gray-500">สถานะ</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-gray-500">ชื่อ</p>
                  <p className="font-medium">{selectedBooking.user_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">เบอร์โทร</p>
                  <p className="font-medium">{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">จำนวนเงิน</p>
                  <p className="font-medium text-primary">{selectedBooking.amount.toLocaleString()} บาท</p>
                </div>
                <div>
                  <p className="text-gray-500">คิว</p>
                  <p className="font-medium">#{selectedBooking.queue_position}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">วันที่จอง</p>
                  <p className="font-medium">{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>

              <Separator />

              {/* Memo Section */}
              <div className="space-y-2">
                <Label htmlFor="memo" className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  บันทึกการสนทนา (Memo)
                </Label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => {
                    setMemo(e.target.value)
                    setIsMemoEdited(true)
                  }}
                  placeholder="บันทึกรายละเอียดการสนทนากับผู้บริจาค (ถ้ามี)..."
                  className="w-full min-h-[80px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {isMemoEdited && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveMemo}
                    disabled={memoMutation.isPending}
                    className="w-full"
                  >
                    {memoMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    บันทึก Memo
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-gray-500 mb-2">สลิปการโอนเงิน</p>
                {selectedBooking.slip_url ? (
                  <div className="relative w-full aspect-[3/4] max-h-96">
                    <Image
                      src={selectedBooking.slip_url}
                      alt="Payment slip"
                      fill
                      className="object-contain rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                    ไม่มีรูปสลิป
                  </div>
                )}
              </div>

              {selectedBooking.status === 'PENDING_VERIFICATION' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => approveMutation.mutate(selectedBooking.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        อนุมัติ
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(selectedBooking.id)}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        ปฏิเสธ
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
