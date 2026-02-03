'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateBookingDetails } from '@/lib/api'
import { TABLE_BASE_PRICE } from '@/lib/constants'
import type { Table, Booking, BookingShirtOrder } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, Lock, Shirt, Plus, X } from 'lucide-react'
import Image from 'next/image'

const AUTH_KEY = 'edit_booking_authenticated'

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

interface ShirtOrder {
  id: number
  type: 'crew' | 'polo'
  size: string
  quantity: number
}

const BASE_PRICE = TABLE_BASE_PRICE
const SHIRT_PRICES = {
  crew: 250,
  polo: 300,
}
const SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
const SHIRT_IMAGES = [
  { src: '/shirt1.jpg', alt: 'แบบเสื้อที่ 1' },
  { src: '/shirt2.jpg', alt: 'แบบเสื้อที่ 2' },
  { src: '/shirt3.jpg', alt: 'แบบเสื้อที่ 3' },
]
const SHIRT_DELIVERY_FEE = 50

export function EditBookingModal({ open, table, onClose }: EditBookingModalProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')

  // Editable states
  const [userName, setUserName] = useState('')
  const [phone, setPhone] = useState('')
  const [donation, setDonation] = useState(0)

  // Shirt orders
  const [shirtOrders, setShirtOrders] = useState<ShirtOrder[]>([])
  const [currentShirtType, setCurrentShirtType] = useState<'crew' | 'polo' | ''>('')
  const [currentShirtSize, setCurrentShirtSize] = useState('')
  const [currentShirtQuantity, setCurrentShirtQuantity] = useState(1)
  const [showShirtPreviewModal, setShowShirtPreviewModal] = useState(false)
  const [selectedShirtImage, setSelectedShirtImage] = useState<number | null>(null)

  // Shirt delivery
  const [shirtDelivery, setShirtDelivery] = useState<'pickup' | 'delivery'>('pickup')
  const [shirtDeliveryAddress, setShirtDeliveryAddress] = useState('')

  // E-Donation
  const [wantEDonation, setWantEDonation] = useState<'yes' | 'no'>('no')
  const [eDonationName, setEDonationName] = useState('')
  const [eDonationAddress, setEDonationAddress] = useState('')
  const [eDonationId, setEDonationId] = useState('')

  const queryClient = useQueryClient()
  const booking = table?.current_booking

  // Calculate totals
  const shirtTotal = shirtOrders.reduce((total, order) => {
    return total + (SHIRT_PRICES[order.type] * order.quantity)
  }, 0)
  const totalShirtQuantity = shirtOrders.reduce((total, order) => total + order.quantity, 0)
  const deliveryFee = shirtOrders.length > 0 && shirtDelivery === 'delivery' ? SHIRT_DELIVERY_FEE : 0
  const tableAmount = BASE_PRICE
  const totalAmount = tableAmount + Math.max(0, donation) + shirtTotal + deliveryFee

  useEffect(() => {
    setAuthenticated(getStoredAuth())
  }, [])

  // Load booking data when modal opens
  useEffect(() => {
    if (booking && open) {
      // Debug: Log booking data to check if extended fields are present
      console.log('[EditBookingModal] Booking data:', {
        id: booking.id,
        user_name: booking.user_name,
        phone: booking.phone,
        amount: booking.amount,
        donation: booking.donation,
        shirt_orders: booking.shirt_orders,
        shirt_delivery: booking.shirt_delivery,
        shirt_delivery_address: booking.shirt_delivery_address,
        e_donation_want: booking.e_donation_want,
        e_donation_name: booking.e_donation_name,
        e_donation_address: booking.e_donation_address,
        e_donation_id: booking.e_donation_id,
      })

      setUserName(booking.user_name || '')
      setPhone(booking.phone || '')
      setDonation(booking.donation || 0)
      setShirtDelivery(booking.shirt_delivery || 'pickup')
      setShirtDeliveryAddress(booking.shirt_delivery_address || '')
      setWantEDonation(booking.e_donation_want ? 'yes' : 'no')
      setEDonationName(booking.e_donation_name || '')
      setEDonationAddress(booking.e_donation_address || '')
      setEDonationId(booking.e_donation_id || '')

      // Load shirt orders
      if (booking.shirt_orders && Array.isArray(booking.shirt_orders)) {
        const orders = (booking.shirt_orders as BookingShirtOrder[]).map((o, i) => ({
          id: Date.now() + i,
          type: o.type,
          size: o.size,
          quantity: o.quantity,
        }))
        setShirtOrders(orders)
      } else {
        setShirtOrders([])
      }
    }
  }, [booking, open])

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
        userName: userName.trim(),
        phone: phone.replace(/\D/g, ''),
        donation: Math.max(0, donation),
        shirtOrders: shirtOrders.map(o => ({ type: o.type, size: o.size, quantity: o.quantity })),
        shirtDelivery: shirtOrders.length > 0 ? shirtDelivery : undefined,
        shirtDeliveryAddress: shirtDelivery === 'delivery' ? shirtDeliveryAddress : undefined,
        eDonationWant: wantEDonation === 'yes',
        eDonationName,
        eDonationAddress,
        eDonationId,
      })
    },
    onSuccess: () => {
      toast.success('บันทึกการแก้ไขสำเร็จ!')
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      onClose()
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
  })

  const handleClose = () => {
    onClose()
  }

  // Add shirt
  const handleAddShirt = () => {
    if (!currentShirtType || !currentShirtSize || currentShirtQuantity < 1) {
      toast.error('กรุณาเลือกประเภท ไซส์ และจำนวนเสื้อ')
      return
    }
    const newOrder: ShirtOrder = {
      id: Date.now(),
      type: currentShirtType,
      size: currentShirtSize,
      quantity: currentShirtQuantity,
    }
    setShirtOrders([...shirtOrders, newOrder])
    setCurrentShirtType('')
    setCurrentShirtSize('')
    setCurrentShirtQuantity(1)
    toast.success('เพิ่มเสื้อในรายการแล้ว')
  }

  // Remove shirt
  const handleRemoveShirt = (id: number) => {
    setShirtOrders(shirtOrders.filter(order => order.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userName.trim()) {
      toast.error('กรุณากรอกชื่อ')
      return
    }
    const phoneTrim = phone.replace(/\D/g, '')
    if (!phoneTrim || phoneTrim.length < 9) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (อย่างน้อย 9 หลัก)')
      return
    }
    if (wantEDonation === 'yes') {
      if (!eDonationName.trim()) {
        toast.error('กรุณากรอกชื่อผู้ขอ E Donation')
        return
      }
      if (!eDonationAddress.trim()) {
        toast.error('กรุณากรอกที่อยู่ผู้ขอ E Donation')
        return
      }
      if (!eDonationId.trim()) {
        toast.error('กรุณากรอกเลขประจำตัวผู้ขอ E Donation')
        return
      }
    }
    if (shirtOrders.length > 0 && shirtDelivery === 'delivery' && !shirtDeliveryAddress.trim()) {
      toast.error('กรุณากรอกที่อยู่จัดส่งเสื้อ')
      return
    }

    updateMutation.mutate()
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

  // Login form
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

  // Edit form - UI like BookingModal
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            แก้ไขการจอง โต๊ะ {table?.label}
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              รออนุมัติ
            </Badge>
          </DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลการจองก่อนส่งให้ Admin อนุมัติ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: ข้อมูลผู้จอง */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">ข้อมูลผู้จอง</h2>
            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อ-นามสกุล *</Label>
              <Input
                id="edit-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
                required
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">เบอร์โทรศัพท์ *</Label>
              <Input
                id="edit-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="0812345678"
                required
                className="min-h-12 text-base"
              />
            </div>
          </section>

          {/* Section 2: บริจาคเพิ่มเติม + E Donation */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">บริจาคเพิ่มเติม</h2>
            <div className="space-y-2">
              <Label htmlFor="edit-donation">จำนวนเงิน (บาท)</Label>
              <Input
                id="edit-donation"
                type="number"
                min="0"
                value={donation || ''}
                onChange={(e) => setDonation(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="min-h-12 text-base"
              />
            </div>

            {/* E Donation */}
            <div className="bg-green-50 p-4 rounded-lg space-y-4 border border-green-100">
              <h3 className="font-semibold text-gray-900">ต้องการออกใบอนุโมทนาบัตร (E Donation)</h3>
              <RadioGroup
                value={wantEDonation}
                onValueChange={(value) => setWantEDonation(value as 'yes' | 'no')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="edit-edonation-yes" />
                  <Label htmlFor="edit-edonation-yes" className="cursor-pointer font-normal">ต้องการ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="edit-edonation-no" />
                  <Label htmlFor="edit-edonation-no" className="cursor-pointer font-normal">ไม่ต้องการ</Label>
                </div>
              </RadioGroup>

              {wantEDonation === 'yes' && (
                <div className="space-y-3 pt-2 border-t border-green-200">
                  <div className="space-y-2">
                    <Label htmlFor="edit-edonationName">ชื่อ ผู้ขอ E Donation *</Label>
                    <Input
                      id="edit-edonationName"
                      value={eDonationName}
                      onChange={(e) => setEDonationName(e.target.value)}
                      placeholder="กรอกชื่อ นามสกุล หรือ ชื่อ หจก./บริษัท"
                      className="min-h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-edonationAddress">ที่อยู่ ผู้ขอ E Donation *</Label>
                    <Input
                      id="edit-edonationAddress"
                      value={eDonationAddress}
                      onChange={(e) => setEDonationAddress(e.target.value)}
                      placeholder="กรอกที่อยู่"
                      className="min-h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-edonationId">เลขประจำตัว ผู้ขอ E Donation *</Label>
                    <Input
                      id="edit-edonationId"
                      value={eDonationId}
                      onChange={(e) => setEDonationId(e.target.value)}
                      placeholder="กรอกเลขประจำตัวผู้เสียภาษี หรือ เลขประจำตัวประชาชน"
                      className="min-h-12 text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: สั่งจองเสื้อที่ระลึก */}
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-blue-600" />
              สั่งจองเสื้อที่ระลึก (ไม่บังคับ)
            </h2>

            {/* Shirt Images */}
            <div className="grid grid-cols-3 gap-2">
              {SHIRT_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedShirtImage(idx)
                    setShowShirtPreviewModal(true)
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-shadow"
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Shirt Preview Modal */}
            <Dialog open={showShirtPreviewModal} onOpenChange={(o) => {
              setShowShirtPreviewModal(o)
              if (!o) setSelectedShirtImage(null)
            }}>
              <DialogContent className="w-full max-h-[92dvh] flex flex-col sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>แบบเสื้อที่ระลึก</DialogTitle>
                  <DialogDescription>
                    {selectedShirtImage !== null ? SHIRT_IMAGES[selectedShirtImage].alt : 'คลิกเพื่อดูแบบเสื้อ'}
                  </DialogDescription>
                </DialogHeader>
                {selectedShirtImage !== null && (
                  <div className="relative w-full min-h-[50vh] rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <Image
                      src={SHIRT_IMAGES[selectedShirtImage].src}
                      alt={SHIRT_IMAGES[selectedShirtImage].alt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, 672px"
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <p className="text-xs text-gray-500 text-center">อยู่ระหว่างออกแบบสีและลาย</p>

            {/* Shirt Type */}
            <div className="space-y-2">
              <Label>ประเภทเสื้อ</Label>
              <RadioGroup
                value={currentShirtType}
                onValueChange={(value) => setCurrentShirtType(value as 'crew' | 'polo')}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crew" id="edit-shirt-crew" />
                  <Label htmlFor="edit-shirt-crew" className="cursor-pointer font-normal">
                    เสื้อคอกลม (ราคา {SHIRT_PRICES.crew} บาท)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="polo" id="edit-shirt-polo" />
                  <Label htmlFor="edit-shirt-polo" className="cursor-pointer font-normal">
                    เสื้อคอปก (ราคา {SHIRT_PRICES.polo} บาท)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Shirt Size */}
            {currentShirtType && (
              <div className="space-y-2">
                <Label>ไซส์เสื้อ</Label>
                <RadioGroup
                  value={currentShirtSize}
                  onValueChange={setCurrentShirtSize}
                  className="flex flex-wrap gap-2"
                >
                  {SHIRT_SIZES.map((size) => (
                    <div key={size} className="flex items-center">
                      <RadioGroupItem value={size} id={`edit-size-${size}`} className="peer sr-only" />
                      <Label
                        htmlFor={`edit-size-${size}`}
                        className="cursor-pointer inline-flex min-h-11 items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm touch-manipulation peer-data-[state=checked]:bg-blue-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:border-blue-600 transition-colors"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Shirt Quantity */}
            {currentShirtType && currentShirtSize && (
              <div className="space-y-2">
                <Label htmlFor="edit-shirtQuantity">จำนวน (ตัว)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-shirtQuantity"
                    type="number"
                    min="1"
                    value={currentShirtQuantity}
                    onChange={(e) => setCurrentShirtQuantity(parseInt(e.target.value) || 1)}
                    placeholder="1"
                    className="w-24 min-h-12 text-base"
                  />
                  <Button
                    type="button"
                    onClick={handleAddShirt}
                    className="min-h-12 bg-blue-600 hover:bg-blue-700 shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มเสื้อ
                  </Button>
                </div>
              </div>
            )}

            {/* Shirt Orders List */}
            {shirtOrders.length > 0 && (
              <div className="space-y-2">
                <Label>รายการเสื้อที่เลือก</Label>
                {shirtOrders.map((order) => (
                  <div key={order.id} className="bg-white p-3 rounded-lg border border-blue-200 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">
                        {order.type === 'crew' ? 'เสื้อคอกลม' : 'เสื้อคอปก'}
                      </span>
                      <span className="text-gray-500 mx-2">ไซส์ {order.size}</span>
                      <span>x {order.quantity} ตัว</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">
                        {(SHIRT_PRICES[order.type] * order.quantity).toLocaleString()} บาท
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveShirt(order.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>รวมเสื้อทั้งหมด ({totalShirtQuantity} ตัว)</span>
                    <span className="text-blue-700">{shirtTotal.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shirt Delivery */}
            {shirtOrders.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-blue-200">
                <Label>การรับเสื้อ</Label>
                <RadioGroup
                  value={shirtDelivery}
                  onValueChange={(v) => {
                    setShirtDelivery(v as 'pickup' | 'delivery')
                    if (v === 'pickup') setShirtDeliveryAddress('')
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="edit-shirt-pickup" />
                    <Label htmlFor="edit-shirt-pickup" className="cursor-pointer font-normal">
                      รับด้วยตนเอง / รับหน้างาน
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="edit-shirt-delivery" />
                    <Label htmlFor="edit-shirt-delivery" className="cursor-pointer font-normal">
                      ส่งให้ตามที่อยู่ท้ายนี้ (+{SHIRT_DELIVERY_FEE} บาท)
                    </Label>
                  </div>
                </RadioGroup>
                {shirtDelivery === 'delivery' && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="edit-shirtDeliveryAddress">ที่อยู่จัดส่ง *</Label>
                    <Input
                      id="edit-shirtDeliveryAddress"
                      value={shirtDeliveryAddress}
                      onChange={(e) => setShirtDeliveryAddress(e.target.value)}
                      placeholder="กรอกที่อยู่จัดส่ง"
                      className="min-h-12 text-base"
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 4: โต๊ะที่จอง */}
          <section className="rounded-xl border border-gray-200 bg-amber-50/80 p-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">โต๊ะที่จอง</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-amber-100 text-sm font-medium">
                {table?.label}
              </span>
              <span className="text-sm text-gray-500">(ราคา {BASE_PRICE.toLocaleString()} บาท)</span>
            </div>
          </section>

          {/* Section 5: ข้อมูลการชำระเงิน */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">ข้อมูลการชำระเงิน</h2>

            <div className="flex justify-between text-sm">
              <span>ราคาโต๊ะ</span>
              <span>{tableAmount.toLocaleString()} บาท</span>
            </div>
            {shirtTotal > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>เสื้อที่ระลึก ({totalShirtQuantity} ตัว)</span>
                <span>+{shirtTotal.toLocaleString()} บาท</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>ค่าส่งเสื้อ</span>
                <span>+{deliveryFee.toLocaleString()} บาท</span>
              </div>
            )}
            {donation > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>บริจาคเพิ่มเติม</span>
                <span>+{donation.toLocaleString()} บาท</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>รวมทั้งหมด</span>
              <span className="text-primary">{totalAmount.toLocaleString()} บาท</span>
            </div>

            {/* Show existing slip if available */}
            {booking.slip_url && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">สลิปที่อัปโหลดไว้</p>
                <div className="relative w-48 h-48 mx-auto">
                  <Image
                    src={booking.slip_url}
                    alt="สลิปการโอนเงิน"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="min-h-12 flex-1 text-base"
              onClick={handleClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="min-h-12 flex-1 text-base"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              บันทึกการแก้ไข
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
