'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPendingBookings, fetchAllBookings, approveBooking, rejectBooking, updateBookingMemo, updateBookingDetails, fetchRegistrations } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import type { Booking, Registration, BookingShirtOrder } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, Check, X, Eye, Clock, CheckCircle, XCircle, AlertCircle, Ban, MessageSquare, Save, ScanLine, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { CheckInPanel } from '@/components/CheckInPanel'

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

const SHIRT_TYPE_LABEL = { crew: 'คอกลม', polo: 'คอปก' }
const SHIRT_PRICES = { crew: 250, polo: 300 }

export function AdminDashboard() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [memo, setMemo] = useState('')
  const [isMemoEdited, setIsMemoEdited] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Editable fields
  const [editUserName, setEditUserName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editDonation, setEditDonation] = useState(0)
  const [editShirtDelivery, setEditShirtDelivery] = useState<'pickup' | 'delivery' | null>(null)
  const [editShirtDeliveryAddress, setEditShirtDeliveryAddress] = useState('')
  const [editEDonationWant, setEditEDonationWant] = useState(false)
  const [editEDonationName, setEditEDonationName] = useState('')
  const [editEDonationAddress, setEditEDonationAddress] = useState('')
  const [editEDonationId, setEditEDonationId] = useState('')
  
  const queryClient = useQueryClient()

  // Update state when selected booking changes
  useEffect(() => {
    if (selectedBooking) {
      setMemo(selectedBooking.memo || '')
      setIsMemoEdited(false)
      setIsEditMode(false)
      // Populate editable fields
      setEditUserName(selectedBooking.user_name || '')
      setEditPhone(selectedBooking.phone || '')
      setEditDonation(selectedBooking.donation || 0)
      setEditShirtDelivery(selectedBooking.shirt_delivery || null)
      setEditShirtDeliveryAddress(selectedBooking.shirt_delivery_address || '')
      setEditEDonationWant(selectedBooking.e_donation_want || false)
      setEditEDonationName(selectedBooking.e_donation_name || '')
      setEditEDonationAddress(selectedBooking.e_donation_address || '')
      setEditEDonationId(selectedBooking.e_donation_id || '')
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

  const updateDetailsMutation = useMutation({
    mutationFn: () => {
      if (!selectedBooking) throw new Error('No booking selected')
      return updateBookingDetails({
        bookingId: selectedBooking.id,
        userName: editUserName,
        phone: editPhone,
        donation: editDonation,
        shirtDelivery: editShirtDelivery,
        shirtDeliveryAddress: editShirtDeliveryAddress,
        eDonationWant: editEDonationWant,
        eDonationName: editEDonationName,
        eDonationAddress: editEDonationAddress,
        eDonationId: editEDonationId,
      })
    },
    onSuccess: () => {
      toast.success('บันทึกข้อมูลสำเร็จ!')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setIsEditMode(false)
      setSelectedBooking(null)
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
  })

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
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="pending" className="gap-1 sm:gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">รอตรวจสอบ</span> ({pendingBookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1 sm:gap-2">
            <span className="hidden sm:inline">ทั้งหมด</span> ({allBookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1 sm:gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">สรุป</span>
          </TabsTrigger>
          <TabsTrigger value="registrations" className="gap-1 sm:gap-2">
            <span className="hidden sm:inline">ไม่จองโต๊ะ</span> ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="checkin" className="gap-1 sm:gap-2">
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">เช็คอิน</span>
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

        <TabsContent value="summary" className="mt-4">
          {isAllLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {allBookings?.filter(b => b.status === 'APPROVED').length || 0}
                    </p>
                    <p className="text-sm text-blue-600">โต๊ะอนุมัติแล้ว</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-700">
                      {allBookings?.filter(b => b.status === 'PENDING_VERIFICATION').length || 0}
                    </p>
                    <p className="text-sm text-yellow-600">รอตรวจสอบ</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {(allBookings?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600">ยอดรวม (บาท)</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {allBookings?.reduce((sum, b) => {
                        const orders = (b.shirt_orders as BookingShirtOrder[]) || []
                        return sum + orders.reduce((s, o) => s + (o.quantity || 0), 0)
                      }, 0) || 0}
                    </p>
                    <p className="text-sm text-purple-600">เสื้อ (ตัว)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">โต๊ะ</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">ผู้จอง</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">เบอร์โทร</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">เสื้อ</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">บริจาค</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">ยอดรวม</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allBookings?.map((booking) => {
                          const shirtOrders = (booking.shirt_orders as BookingShirtOrder[]) || []
                          const shirtSummary = shirtOrders.length > 0
                            ? shirtOrders.map(o => `${SHIRT_TYPE_LABEL[o.type]} ${o.size} x${o.quantity}`).join(', ')
                            : '-'
                          const totalShirts = shirtOrders.reduce((s, o) => s + (o.quantity || 0), 0)
                          
                          return (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">
                                {booking.table?.label || `#${booking.table_id}`}
                              </td>
                              <td className="px-4 py-3">{booking.user_name}</td>
                              <td className="px-4 py-3 text-gray-500">{booking.phone}</td>
                              <td className="px-4 py-3">
                                {totalShirts > 0 ? (
                                  <span className="text-blue-600" title={shirtSummary}>
                                    {totalShirts} ตัว
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {(booking.donation || 0) > 0 ? (
                                  <span className="text-green-600">+{(booking.donation || 0).toLocaleString()}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {(booking.amount || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {getStatusBadge(booking.status)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 font-medium">
                        <tr>
                          <td className="px-4 py-3" colSpan={3}>รวมทั้งหมด</td>
                          <td className="px-4 py-3 text-blue-600">
                            {allBookings?.reduce((sum, b) => {
                              const orders = (b.shirt_orders as BookingShirtOrder[]) || []
                              return sum + orders.reduce((s, o) => s + (o.quantity || 0), 0)
                            }, 0) || 0} ตัว
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            +{(allBookings?.reduce((sum, b) => sum + (b.donation || 0), 0) || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-primary">
                            {(allBookings?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Shirt Summary - Aggregated (Bookings + Registrations) */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">สรุปยอดเสื้อ (รวมจองโต๊ะ + จองเสื้อ)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">ประเภท</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">ไซส์</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">จำนวน</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">ราคา/ตัว</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">ราคารวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          // Aggregate shirt orders from both bookings AND registrations
                          const shirtMap = new Map<string, number>()
                          
                          // From bookings (จองโต๊ะ)
                          allBookings?.forEach(b => {
                            const orders = (b.shirt_orders as BookingShirtOrder[]) || []
                            orders.forEach(o => {
                              const key = `${o.type}|${o.size}`
                              shirtMap.set(key, (shirtMap.get(key) || 0) + (o.quantity || 0))
                            })
                          })
                          
                          // From registrations (จองเสื้อ)
                          registrations?.forEach(r => {
                            const orders = (r.shirt_orders as BookingShirtOrder[]) || []
                            orders.forEach(o => {
                              const key = `${o.type}|${o.size}`
                              shirtMap.set(key, (shirtMap.get(key) || 0) + (o.quantity || 0))
                            })
                          })
                          
                          const entries = Array.from(shirtMap.entries()).sort()
                          if (entries.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="px-4 py-3 text-center text-gray-400">
                                  ไม่มีรายการสั่งเสื้อ
                                </td>
                              </tr>
                            )
                          }
                          return entries.map(([key, qty]) => {
                            const [type, size] = key.split('|')
                            const price = SHIRT_PRICES[type as 'crew' | 'polo'] || 0
                            const totalPrice = price * qty
                            return (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{SHIRT_TYPE_LABEL[type as 'crew' | 'polo'] || type}</td>
                                <td className="px-4 py-2">{size}</td>
                                <td className="px-4 py-2 text-right font-medium">{qty}</td>
                                <td className="px-4 py-2 text-right text-gray-600">{price.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right font-medium text-blue-600">{totalPrice.toLocaleString()}</td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                      <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                        {(() => {
                          let totalQty = 0
                          let grandTotal = 0
                          
                          // From bookings
                          allBookings?.forEach(b => {
                            const orders = (b.shirt_orders as BookingShirtOrder[]) || []
                            orders.forEach(o => {
                              const qty = o.quantity || 0
                              const price = SHIRT_PRICES[o.type as 'crew' | 'polo'] || 0
                              totalQty += qty
                              grandTotal += price * qty
                            })
                          })
                          
                          // From registrations
                          registrations?.forEach(r => {
                            const orders = (r.shirt_orders as BookingShirtOrder[]) || []
                            orders.forEach(o => {
                              const qty = o.quantity || 0
                              const price = SHIRT_PRICES[o.type as 'crew' | 'polo'] || 0
                              totalQty += qty
                              grandTotal += price * qty
                            })
                          })
                          
                          if (totalQty === 0) return null
                          return (
                            <tr className="font-bold">
                              <td className="px-4 py-3" colSpan={2}>รวมทั้งหมด</td>
                              <td className="px-4 py-3 text-right">{totalQty} ตัว</td>
                              <td className="px-4 py-3"></td>
                              <td className="px-4 py-3 text-right text-blue-700">{grandTotal.toLocaleString()} บาท</td>
                            </tr>
                          )
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Shirt Orders Detail - By Person (Bookings + Registrations) */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">รายละเอียดการสั่งเสื้อ (แยกตามผู้สั่ง)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">ประเภท</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">ผู้สั่ง</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">เบอร์โทร</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">รายการเสื้อ</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">การจัดส่ง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          // Get bookings with shirt orders
                          const bookingsWithShirts = (allBookings?.filter(b => {
                            const orders = (b.shirt_orders as BookingShirtOrder[]) || []
                            return orders.length > 0
                          }) || []).map(b => ({ ...b, source: 'booking' as const }))
                          
                          // Get registrations with shirt orders
                          const regsWithShirts = (registrations?.filter(r => {
                            const orders = (r.shirt_orders as BookingShirtOrder[]) || []
                            return orders.length > 0
                          }) || []).map(r => ({ ...r, source: 'registration' as const }))
                          
                          const allWithShirts = [...bookingsWithShirts, ...regsWithShirts]
                          
                          if (allWithShirts.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="px-4 py-3 text-center text-gray-400">
                                  ไม่มีรายการสั่งเสื้อ
                                </td>
                              </tr>
                            )
                          }
                          
                          return allWithShirts.map((item) => {
                            const orders = (item.shirt_orders as BookingShirtOrder[]) || []
                            const shirtSummary = orders.map(o => 
                              `${SHIRT_TYPE_LABEL[o.type as 'crew' | 'polo'] || o.type} ${o.size} x${o.quantity}`
                            ).join(', ')
                            
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  {item.source === 'booking' ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                      จองโต๊ะ
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                                      จองเสื้อ
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-medium">{item.user_name}</td>
                                <td className="px-3 py-2 text-gray-600">{item.phone}</td>
                                <td className="px-3 py-2">{shirtSummary}</td>
                                <td className="px-3 py-2 text-sm">
                                  {item.shirt_delivery === 'delivery' ? (
                                    <div>
                                      <span className="text-blue-600 font-medium">📦 จัดส่ง</span>
                                      <p className="text-gray-500 text-xs mt-0.5 max-w-xs truncate" title={item.shirt_delivery_address || ''}>
                                        {item.shirt_delivery_address || '-'}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-green-600">🏠 รับหน้างาน</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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

        <TabsContent value="checkin" className="mt-4">
          <CheckInPanel />
        </TabsContent>
      </Tabs>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>รายละเอียดการจอง</span>
              {!isEditMode && (
                <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                  แก้ไข
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Basic Info */}
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
                  {isEditMode ? (
                    <Input value={editUserName} onChange={(e) => setEditUserName(e.target.value)} className="h-8" />
                  ) : (
                    <p className="font-medium">{selectedBooking.user_name}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">เบอร์โทร</p>
                  {isEditMode ? (
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-8" />
                  ) : (
                    <p className="font-medium">{selectedBooking.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">จำนวนเงินรวม</p>
                  <p className="font-medium text-primary">{selectedBooking.amount.toLocaleString()} บาท</p>
                </div>
                <div>
                  <p className="text-gray-500">คิว / วันที่</p>
                  <p className="font-medium">#{selectedBooking.queue_position} · {formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>

              <Separator />

              {/* Extended Info - Shirts */}
              <div className="space-y-2">
                <p className="text-gray-500 font-medium">รายการสั่งเสื้อ</p>
                {(selectedBooking.shirt_orders?.length || 0) > 0 ? (
                  <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                    {(selectedBooking.shirt_orders as BookingShirtOrder[])?.map((order, idx) => (
                      <p key={idx} className="text-sm">
                        {SHIRT_TYPE_LABEL[order.type]} ไซส์ {order.size} × {order.quantity} ตัว
                      </p>
                    ))}
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>การรับเสื้อ:</strong> {
                        isEditMode ? (
                          <select 
                            value={editShirtDelivery || ''} 
                            onChange={(e) => setEditShirtDelivery(e.target.value as 'pickup' | 'delivery' | null || null)}
                            className="ml-2 border rounded px-2 py-1 text-sm"
                          >
                            <option value="pickup">รับหน้างาน</option>
                            <option value="delivery">ส่งตามที่อยู่</option>
                          </select>
                        ) : (
                          selectedBooking.shirt_delivery === 'delivery' ? 'ส่งตามที่อยู่' : 'รับหน้างาน'
                        )
                      }
                    </p>
                    {(selectedBooking.shirt_delivery === 'delivery' || editShirtDelivery === 'delivery') && (
                      <div className="text-sm">
                        <strong>ที่อยู่จัดส่ง:</strong>
                        {isEditMode ? (
                          <Input 
                            value={editShirtDeliveryAddress} 
                            onChange={(e) => setEditShirtDeliveryAddress(e.target.value)} 
                            className="h-8 mt-1"
                            placeholder="ที่อยู่จัดส่ง"
                          />
                        ) : (
                          <span className="ml-2">{selectedBooking.shirt_delivery_address || '-'}</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">ไม่มีการสั่งเสื้อ</p>
                )}
              </div>

              {/* Extended Info - Donation */}
              <div className="space-y-2">
                <p className="text-gray-500 font-medium">บริจาคเพิ่มเติม</p>
                {isEditMode ? (
                  <Input 
                    type="number" 
                    value={editDonation} 
                    onChange={(e) => setEditDonation(parseInt(e.target.value) || 0)} 
                    className="h-8 w-32"
                  />
                ) : (
                  <p className="text-sm">{(selectedBooking.donation || 0).toLocaleString()} บาท</p>
                )}
              </div>

              {/* E-Donation */}
              <div className="space-y-2">
                <p className="text-gray-500 font-medium">ใบอนุโมทนาบัตร (E-Donation)</p>
                {isEditMode ? (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={editEDonationWant} 
                        onChange={(e) => setEditEDonationWant(e.target.checked)} 
                      />
                      ต้องการใบอนุโมทนาบัตร
                    </label>
                    {editEDonationWant && (
                      <div className="space-y-2 pl-6">
                        <Input placeholder="ชื่อ" value={editEDonationName} onChange={(e) => setEditEDonationName(e.target.value)} className="h-8" />
                        <Input placeholder="ที่อยู่" value={editEDonationAddress} onChange={(e) => setEditEDonationAddress(e.target.value)} className="h-8" />
                        <Input placeholder="เลขบัตรประชาชน" value={editEDonationId} onChange={(e) => setEditEDonationId(e.target.value)} className="h-8" />
                      </div>
                    )}
                  </div>
                ) : selectedBooking.e_donation_want ? (
                  <div className="bg-green-50 rounded-lg p-3 text-sm space-y-1">
                    <p><strong>ชื่อ:</strong> {selectedBooking.e_donation_name || '-'}</p>
                    <p><strong>ที่อยู่:</strong> {selectedBooking.e_donation_address || '-'}</p>
                    <p><strong>เลขบัตร:</strong> {selectedBooking.e_donation_id || '-'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">ไม่ต้องการ</p>
                )}
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
                  className="w-full min-h-[60px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

              {/* Slip Image */}
              <div>
                <p className="text-gray-500 mb-2">สลิปการโอนเงิน</p>
                {selectedBooking.slip_url ? (
                  <div className="relative w-full aspect-[3/4] max-h-64">
                    <Image
                      src={selectedBooking.slip_url}
                      alt="Payment slip"
                      fill
                      className="object-contain rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
                    ไม่มีรูปสลิป
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditMode ? (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => updateDetailsMutation.mutate()}
                    disabled={updateDetailsMutation.isPending}
                  >
                    {updateDetailsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    บันทึกการแก้ไข
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    ยกเลิก
                  </Button>
                </div>
              ) : selectedBooking.status === 'PENDING_VERIFICATION' && (
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
