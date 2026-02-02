'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateBookingDetails } from '@/lib/api'
import type { Table, Booking, BookingShirtOrder } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, Save, Lock, Edit2 } from 'lucide-react'

const AUTH_KEY = 'edit_booking_authenticated'
const SHIRT_TYPE_LABEL = { crew: 'คอกลม', polo: 'คอปก' }

function getStoredAuth(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(AUTH_KEY) === '1'
}

function setStoredAuth(ok: boolean) {
  if (typeof window === 'undefined') return
  if (ok) sessionStorage.setItem(AUTH_KEY, '1')
  else sessionStorage.removeItem(AUTH_KEY)
}

type TableWithBooking = Table & { current_booking?: Booking }

interface EditBookingModalProps {
  open: boolean
  table: TableWithBooking | null
  onClose: () => void
}

export function EditBookingModal({ open, table, onClose }: EditBookingModalProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [editUserName, setEditUserName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editDonation, setEditDonation] = useState(0)
  const [editShirtDelivery, setEditShirtDelivery] = useState<'pickup' | 'delivery' | null>(null)
  const [editShirtDeliveryAddress, setEditShirtDeliveryAddress] = useState('')
  
  const queryClient = useQueryClient()
  const booking = table?.current_booking

  useEffect(() => {
    setAuthenticated(getStoredAuth())
  }, [])

  useEffect(() => {
    if (booking) {
      setEditUserName(booking.user_name || '')
      setEditPhone(booking.phone || '')
      setEditDonation(booking.donation || 0)
      setEditShirtDelivery(booking.shirt_delivery || null)
      setEditShirtDeliveryAddress(booking.shirt_delivery_address || '')
      setIsEditMode(false)
    }
  }, [booking])

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

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!booking) throw new Error('No booking')
      return updateBookingDetails({
        bookingId: booking.id,
        userName: editUserName,
        phone: editPhone,
        donation: editDonation,
        shirtDelivery: editShirtDelivery,
        shirtDeliveryAddress: editShirtDeliveryAddress,
      })
    },
    onSuccess: () => {
      toast.success('บันทึกการแก้ไขสำเร็จ!')
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setIsEditMode(false)
      onClose()
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
  })

  const handleClose = () => {
    setIsEditMode(false)
    onClose()
  }

  if (!booking) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>โต๊ะ {table?.label}</DialogTitle>
            <DialogDescription>ไม่มีข้อมูลการจอง</DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose}>ปิด</Button>
        </DialogContent>
      </Dialog>
    )
  }

  // Show login form if not authenticated
  if (!authenticated) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto p-3 bg-amber-100 rounded-full mb-2">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">แก้ไขการจอง โต๊ะ {table?.label}</DialogTitle>
            <DialogDescription className="text-center">
              กรุณาเข้าสู่ระบบเพื่อแก้ไขข้อมูล
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-login-user">ชื่อผู้ใช้</Label>
              <Input
                id="edit-login-user"
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="username"
                className="min-h-11"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-login-pass">รหัสผ่าน</Label>
              <Input
                id="edit-login-pass"
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
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 min-h-11">
                เข้าสู่ระบบ
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Show booking details with edit capability
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>โต๊ะ {table?.label} - แก้ไขการจอง</span>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              รออนุมัติ
            </Badge>
          </DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลการจองก่อนส่งให้ Admin อนุมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                ข้อมูลผู้จอง
                {!isEditMode && (
                  <Button size="sm" variant="ghost" onClick={() => setIsEditMode(true)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    แก้ไข
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">ชื่อ</Label>
                  {isEditMode ? (
                    <Input 
                      value={editUserName} 
                      onChange={(e) => setEditUserName(e.target.value)} 
                      className="h-9"
                    />
                  ) : (
                    <p className="font-medium">{booking.user_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">เบอร์โทร</Label>
                  {isEditMode ? (
                    <Input 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)} 
                      className="h-9"
                    />
                  ) : (
                    <p className="font-medium">{booking.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">จำนวนเงินรวม</Label>
                <p className="font-medium text-primary">{booking.amount.toLocaleString()} บาท</p>
              </div>
            </CardContent>
          </Card>

          {/* Shirt Orders */}
          {(booking.shirt_orders?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">รายการสั่งเสื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(booking.shirt_orders as BookingShirtOrder[])?.map((order, idx) => (
                  <p key={idx} className="text-sm">
                    {SHIRT_TYPE_LABEL[order.type]} ไซส์ {order.size} × {order.quantity} ตัว
                  </p>
                ))}
                <Separator className="my-2" />
                <div>
                  <Label className="text-xs text-gray-500">การรับเสื้อ</Label>
                  {isEditMode ? (
                    <select 
                      value={editShirtDelivery || 'pickup'} 
                      onChange={(e) => setEditShirtDelivery(e.target.value as 'pickup' | 'delivery')}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="pickup">รับหน้างาน</option>
                      <option value="delivery">ส่งตามที่อยู่</option>
                    </select>
                  ) : (
                    <p className="text-sm">{booking.shirt_delivery === 'delivery' ? 'ส่งตามที่อยู่' : 'รับหน้างาน'}</p>
                  )}
                </div>
                {(editShirtDelivery === 'delivery' || booking.shirt_delivery === 'delivery') && (
                  <div>
                    <Label className="text-xs text-gray-500">ที่อยู่จัดส่ง</Label>
                    {isEditMode ? (
                      <Input 
                        value={editShirtDeliveryAddress} 
                        onChange={(e) => setEditShirtDeliveryAddress(e.target.value)} 
                        className="h-9"
                        placeholder="ที่อยู่จัดส่ง"
                      />
                    ) : (
                      <p className="text-sm">{booking.shirt_delivery_address || '-'}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Donation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">บริจาคเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={editDonation} 
                    onChange={(e) => setEditDonation(parseInt(e.target.value) || 0)} 
                    className="h-9 w-32"
                  />
                  <span className="text-sm text-gray-500">บาท</span>
                </div>
              ) : (
                <p className="text-sm">{(booking.donation || 0).toLocaleString()} บาท</p>
              )}
            </CardContent>
          </Card>

          {/* E-Donation */}
          {booking.e_donation_want && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ใบอนุโมทนาบัตร</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>ชื่อ:</strong> {booking.e_donation_name || '-'}</p>
                <p><strong>ที่อยู่:</strong> {booking.e_donation_address || '-'}</p>
                <p><strong>เลขบัตร:</strong> {booking.e_donation_id || '-'}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {isEditMode ? (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
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
          ) : (
            <Button variant="outline" className="w-full" onClick={handleClose}>
              ปิด
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
