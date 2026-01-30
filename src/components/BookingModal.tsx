'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createBooking, uploadSlip, fetchTables, createRegistration } from '@/lib/api'
import { TABLE_BASE_PRICE } from '@/lib/constants'
import type { Table } from '@/types/database'

type TableWithBooking = Table & { current_booking?: { id: string } }

function parseTableLabel(label: string): { row: number; col: number } {
  const m = label.match(/^([A-I])-(\d{1,2})$/)
  if (!m) return { row: 0, col: 0 }
  const row = m[1].charCodeAt(0) - 65
  const col = parseInt(m[2], 10) - 1
  return { row, col }
}

function manhattan(a: { row: number; col: number }, b: { row: number; col: number }): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
}

function sortByNearest(
  available: Table[],
  selected: Table[]
): Table[] {
  if (selected.length === 0) return [...available]
  const keys = selected.map(t => parseTableLabel(t.label))
  return [...available].sort((x, y) => {
    const xk = parseTableLabel(x.label)
    const yk = parseTableLabel(y.label)
    const dx = Math.min(...keys.map(k => manhattan(k, xk)))
    const dy = Math.min(...keys.map(k => manhattan(k, yk)))
    return dx - dy
  })
}
import { toast } from 'sonner'
import { Loader2, Upload, Shirt, Plus, X } from 'lucide-react'
import Image from 'next/image'

interface BookingModalProps {
  open: boolean
  table: Table | null
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
  crew: 250,  // เสื้อคอกลม
  polo: 350,  // เสื้อคอปก
}

const SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

const SHIRT_SIZE_IMAGE = { src: '/size-t-shirt.jpg', alt: 'ตารางไซส์เสื้อ' }
const SHIRT_DELIVERY_FEE = 50 // บาท ต่อ 1 คน เมื่อเลือกส่งตามที่อยู่

export function BookingModal({ open, table, onClose }: BookingModalProps) {
  const [userName, setUserName] = useState('')
  const [phone, setPhone] = useState('')
  const [donation, setDonation] = useState(0)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Shirt order states - support multiple orders
  const [shirtOrders, setShirtOrders] = useState<ShirtOrder[]>([])
  const [currentShirtType, setCurrentShirtType] = useState<'crew' | 'polo' | ''>('')
  const [currentShirtSize, setCurrentShirtSize] = useState('')
  const [currentShirtQuantity, setCurrentShirtQuantity] = useState(1)
  const [showShirtPreviewModal, setShowShirtPreviewModal] = useState(false)
  
  // การรับเสื้อ: รับหน้างาน | ส่งตามที่อยู่
  const [shirtDelivery, setShirtDelivery] = useState<'pickup' | 'delivery'>('pickup')
  const [shirtDeliveryAddress, setShirtDeliveryAddress] = useState('')
  
  // E Donation (ใบอนุโมทนาบัตร)
  const [wantEDonation, setWantEDonation] = useState<'yes' | 'no'>('no')
  const [eDonationName, setEDonationName] = useState('')
  const [eDonationAddress, setEDonationAddress] = useState('')
  const [eDonationId, setEDonationId] = useState('')

  // การจองโต๊ะ: ไม่จอง | จอง X ตัว, รายการโต๊ะที่เลือก (ตัวที่ 1 จาก grid, ตัวที่ 2+ จาก dropdown)
  const [bookTableOption, setBookTableOption] = useState<'none' | 'book'>('book')
  const [tableCount, setTableCount] = useState(1)
  const [selectedTables, setSelectedTables] = useState<Table[]>([])

  const { data: allTables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
    enabled: open,
  })
  const queryClient = useQueryClient()

  const isBookingTable = bookTableOption === 'book'

  const shirtTotal = shirtOrders.reduce((total, order) => {
    return total + (SHIRT_PRICES[order.type] * order.quantity)
  }, 0)
  const totalShirtQuantity = shirtOrders.reduce((total, order) => total + order.quantity, 0)
  const deliveryFee = shirtOrders.length > 0 && shirtDelivery === 'delivery' ? SHIRT_DELIVERY_FEE : 0
  const tableAmount = isBookingTable ? BASE_PRICE * Math.max(1, selectedTables.length) : 0
  const totalAmount = tableAmount + Math.max(0, donation) + shirtTotal + deliveryFee
  const eDonationEnabled = totalAmount > 0

  const availableTables = useMemo(() => {
    const list = allTables as TableWithBooking[]
    return list.filter(
      t => t.status === 'AVAILABLE' && (t.current_queue_count ?? 0) === 0
    )
  }, [allTables])

  const availableForDropdown = useMemo(() => {
    const ids = new Set(selectedTables.map(t => t.id))
    const remain = availableTables.filter(t => !ids.has(t.id))
    return sortByNearest(remain, selectedTables)
  }, [availableTables, selectedTables])

  useEffect(() => {
    if (table) {
      setBookTableOption('book')
      setTableCount(1)
      setSelectedTables([table])
    } else {
      setBookTableOption('none')
      setSelectedTables([])
    }
  }, [table])

  useEffect(() => {
    if (!isBookingTable || !table || selectedTables.length === 0) return
    const n = Math.max(1, tableCount)
    if (selectedTables.length === n) return
    if (selectedTables.length > n) {
      setSelectedTables(prev => prev.slice(0, n))
      return
    }
    const ids = new Set(selectedTables.map(t => t.id))
    const remain = availableTables.filter(t => !ids.has(t.id))
    const sorted = sortByNearest(remain, selectedTables)
    const add = sorted.slice(0, n - selectedTables.length)
    if (add.length) setSelectedTables(prev => [...prev, ...add])
  }, [tableCount, isBookingTable, table, availableTables, selectedTables])

  useEffect(() => {
    if (!eDonationEnabled) {
      setWantEDonation('no')
      setEDonationName('')
      setEDonationAddress('')
      setEDonationId('')
    }
  }, [eDonationEnabled])

  const registrationMutation = useMutation({
    mutationFn: async (payload: {
      user_name: string
      phone: string
      donation: number
      shirt_orders: { type: 'crew' | 'polo'; size: string; quantity: number }[]
      shirt_delivery: 'pickup' | 'delivery'
      shirt_delivery_address: string
      e_donation_want: boolean
      e_donation_name: string
      e_donation_address: string
      e_donation_id: string
      total_amount: number
      slip_file: File | null
    }) => {
      let slipUrl: string | null = null
      if (payload.slip_file) {
        slipUrl = await uploadSlip(payload.slip_file)
      }
      return createRegistration({
        user_name: payload.user_name,
        phone: payload.phone,
        donation: payload.donation,
        shirt_orders: payload.shirt_orders,
        shirt_delivery: payload.shirt_delivery,
        shirt_delivery_address: payload.shirt_delivery_address,
        e_donation_want: payload.e_donation_want,
        e_donation_name: payload.e_donation_name,
        e_donation_address: payload.e_donation_address,
        e_donation_id: payload.e_donation_id,
        total_amount: payload.total_amount,
        slip_url: slipUrl,
      })
    },
    onSuccess: () => {
      toast.success('บันทึกข้อมูลแล้ว (ไม่จองโต๊ะ)', {
        description: 'ระบบลงทะเบียนแบบไม่จองโต๊ะ บันทึกเรียบร้อย',
      })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      handleClose()
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', { description: error.message })
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTables.length || !slipFile) throw new Error('ข้อมูลไม่ครบ')
      
      setIsUploading(true)
      const slipUrl = await uploadSlip(slipFile)
      const shirtTot = shirtOrders.reduce((s, o) => s + SHIRT_PRICES[o.type] * o.quantity, 0)
      const deliveryFee = shirtOrders.length > 0 && shirtDelivery === 'delivery' ? SHIRT_DELIVERY_FEE : 0
      const extra = Math.max(0, donation) + shirtTot + deliveryFee
      const phoneNorm = phone.replace(/\D/g, '')
      const name = userName.trim()

      const firstAmount = BASE_PRICE + extra
      const restAmount = BASE_PRICE

      await createBooking(selectedTables[0].id, name, phoneNorm, firstAmount, slipUrl)
      for (let i = 1; i < selectedTables.length; i++) {
        await createBooking(selectedTables[i].id, name, phoneNorm, restAmount, slipUrl)
      }
    },
    onSuccess: () => {
      toast.success('จองโต๊ะสำเร็จ!', {
        description: 'กรุณารอการยืนยันจากผู้ดูแลระบบ',
      })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      handleClose()
    },
    onError: (error: Error) => {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message,
      })
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('ขนาดไฟล์เกิน 5 MB กรุณาเลือกไฟล์ที่เล็กลง')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP)')
      return
    }
    setSlipFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setSlipPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleClose = () => {
    setUserName('')
    setPhone('')
    setDonation(0)
    setSlipFile(null)
    setSlipPreview(null)
    setShirtOrders([])
    setCurrentShirtType('')
    setCurrentShirtSize('')
    setCurrentShirtQuantity(1)
    setShirtDelivery('pickup')
    setShirtDeliveryAddress('')
    setWantEDonation('no')
    setEDonationName('')
    setEDonationAddress('')
    setEDonationId('')
    setBookTableOption('book')
    setTableCount(1)
    setSelectedTables([])
    onClose()
  }

  // Add shirt to orders list
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
    // Reset current selection
    setCurrentShirtType('')
    setCurrentShirtSize('')
    setCurrentShirtQuantity(1)
    toast.success('เพิ่มเสื้อในรายการแล้ว')
  }

  // Remove shirt from orders list
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

    if (!isBookingTable) {
      if (totalAmount > 0 && !slipFile) {
        toast.error('กรุณาอัปโหลดสลิปแนบหลักฐานการโอนก่อนยืนยัน')
        return
      }
      const payload = {
        user_name: userName.trim(),
        phone: phone.replace(/\D/g, ''),
        donation: Math.max(0, donation),
        shirt_orders: shirtOrders.map(o => ({ type: o.type, size: o.size, quantity: o.quantity })),
        shirt_delivery: shirtDelivery,
        shirt_delivery_address: shirtDeliveryAddress,
        e_donation_want: wantEDonation === 'yes',
        e_donation_name: eDonationName,
        e_donation_address: eDonationAddress,
        e_donation_id: eDonationId,
        total_amount: totalAmount,
        slip_file: totalAmount > 0 ? slipFile : null,
      }
      setIsUploading(!!payload.slip_file)
      registrationMutation.mutate(payload)
      return
    }

    if (!table) {
      toast.error('กรุณาเลือกโต๊ะจากผัง')
      return
    }
    if (selectedTables.length < tableCount) {
      toast.error('กรุณาเลือกโต๊ะครบตามจำนวน (ตัวที่ 2, 3, 4 ฯลฯ เลือกจาก dropdown)')
      return
    }
    if (!slipFile) {
      toast.error('กรุณาอัปโหลดสลิปการโอนเงิน')
      return
    }

    bookingMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {table ? `จองโต๊ะ ${table.label}` : 'ลงทะเบียน (ไม่จองโต๊ะ)'}
          </DialogTitle>
          <DialogDescription>
            {table
              ? `กรอกข้อมูลและอัปโหลดสลิปเพื่อจองโต๊ะ (ราคา ${BASE_PRICE.toLocaleString()} บาท/โต๊ะ)`
              : 'กรอกข้อมูลบริจาคหรือสั่งเสื้อโดยไม่จองโต๊ะ'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: ข้อมูลผู้จอง */}
          <section
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-4"
            aria-labelledby="section-booking-info"
          >
            <h2 id="section-booking-info" className="text-base font-semibold text-gray-900">
              ข้อมูลผู้จอง
            </h2>
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
              <Input
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
                required
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
              <Input
                id="phone"
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
          <section
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-4"
            aria-labelledby="section-donation"
          >
            <h2 id="section-donation" className="text-base font-semibold text-gray-900">
              บริจาคเพิ่มเติม
            </h2>
            <div className="space-y-2">
              <Label htmlFor="donation">จำนวนเงิน (บาท)</Label>
              <Input
                id="donation"
                type="number"
                min="0"
                value={donation || ''}
                onChange={(e) => setDonation(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="min-h-12 text-base"
              />
            </div>

            {/* E Donation - แสดงเมื่อยอดรวมทั้งหมด > 0 */}
            {totalAmount > 0 && (
              <div className="bg-green-50 p-4 rounded-lg space-y-4 border border-green-100">
                <h3 className="font-semibold text-gray-900">ต้องการออกใบอนุโมทนาบัตร (E Donation)</h3>
              <RadioGroup
                value={wantEDonation}
                onValueChange={(value) => setWantEDonation(value as 'yes' | 'no')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="edonation-yes" />
                  <Label htmlFor="edonation-yes" className="cursor-pointer font-normal">
                    ต้องการ
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="edonation-no" />
                  <Label htmlFor="edonation-no" className="cursor-pointer font-normal">
                    ไม่ต้องการ
                  </Label>
                </div>
              </RadioGroup>

              {wantEDonation === 'yes' && (
                <div className="space-y-3 pt-2 border-t border-green-200">
                  <div className="space-y-2">
                    <Label htmlFor="edonationName">ชื่อ ผู้ขอ E Donation *</Label>
                    <Input
                      id="edonationName"
                      value={eDonationName}
                      onChange={(e) => setEDonationName(e.target.value)}
                      placeholder="กรอกชื่อ นามสกุล หรือ ชื่อ หจก./บริษัท"
                      className="min-h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edonationAddress">ที่อยู่ ผู้ขอ E Donation *</Label>
                    <Input
                      id="edonationAddress"
                      value={eDonationAddress}
                      onChange={(e) => setEDonationAddress(e.target.value)}
                      placeholder="กรอกที่อยู่"
                      className="min-h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edonationId">เลขประจำตัว ผู้ขอ E Donation *</Label>
                    <Input
                      id="edonationId"
                      value={eDonationId}
                      onChange={(e) => setEDonationId(e.target.value)}
                      placeholder="กรอกเลขประจำตัวผู้เสียภาษี หรือ เลขประจำตัวประชาชน"
                      className="min-h-12 text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          </section>

          {/* Section 3: สั่งจองเสื้อที่ระลึก */}
          <section
            className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4"
            aria-labelledby="section-shirt"
          >
            <h2 id="section-shirt" className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-blue-600" />
              สั่งจองเสื้อที่ระลึก (ไม่บังคับ)
            </h2>
            
            {/* Shirt Size Chart - คลิกเพื่อดูแบบเสื้อ (Pacdora) */}
            <button
              type="button"
              onClick={() => setShowShirtPreviewModal(true)}
              className="relative w-full aspect-[2/1] rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-shadow"
            >
              <Image
                src={SHIRT_SIZE_IMAGE.src}
                alt={SHIRT_SIZE_IMAGE.alt}
                fill
                className="object-contain"
              />
            </button>
            {/* Modal แสดงรูปตารางไซส์เสื้อ ขนาดใหญ่ */}
            <Dialog open={showShirtPreviewModal} onOpenChange={setShowShirtPreviewModal}>
              <DialogContent className="w-full max-h-[92dvh] flex flex-col sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>ตารางไซส์เสื้อที่ระลึก</DialogTitle>
                  <DialogDescription>
                    ตารางไซส์เสื้อคอกลมและเสื้อคอปก — SIZE ผู้ใหญ่
                  </DialogDescription>
                </DialogHeader>
                <div className="relative w-full min-h-[50vh] rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <Image
                    src={SHIRT_SIZE_IMAGE.src}
                    alt={SHIRT_SIZE_IMAGE.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 672px"
                  />
                </div>
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
                  <RadioGroupItem value="crew" id="shirt-crew" />
                  <Label htmlFor="shirt-crew" className="cursor-pointer font-normal">
                    เสื้อคอกลม (ราคา {SHIRT_PRICES.crew} บาท)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="polo" id="shirt-polo" />
                  <Label htmlFor="shirt-polo" className="cursor-pointer font-normal">
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
                      <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                      <Label
                        htmlFor={`size-${size}`}
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
                <Label htmlFor="shirtQuantity">จำนวน (ตัว)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="shirtQuantity"
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
                        aria-label={`ลบ ${order.type === 'crew' ? 'เสื้อคอกลม' : 'เสื้อคอปก'} ไซส์ ${order.size}`}
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

            {/* การรับเสื้อ - แสดงเมื่อมีรายการเสื้อ */}
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
                    <RadioGroupItem value="pickup" id="shirt-pickup" />
                    <Label htmlFor="shirt-pickup" className="cursor-pointer font-normal">
                      รับด้วยตนเอง / รับหน้างาน
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="shirt-delivery" />
                    <Label htmlFor="shirt-delivery" className="cursor-pointer font-normal">
                      ส่งให้ตามที่อยู่ท้ายนี้ (+{SHIRT_DELIVERY_FEE} บาท)
                    </Label>
                  </div>
                </RadioGroup>
                {shirtDelivery === 'delivery' && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="shirtDeliveryAddress">ที่อยู่จัดส่ง *</Label>
                    <Input
                      id="shirtDeliveryAddress"
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

          {/* Section การจองโต๊ะ - อยู่ใต้ส่วนเสื้อ */}
          <section
            className="rounded-xl border border-gray-200 bg-amber-50/80 p-4 space-y-4"
            aria-labelledby="section-table-booking"
          >
            <h2 id="section-table-booking" className="text-base font-semibold text-gray-900">
              การจองโต๊ะ
            </h2>
            <RadioGroup
              value={bookTableOption}
              onValueChange={(v) => {
                setBookTableOption(v as 'none' | 'book')
                if (v === 'book' && table) {
                  setTableCount(1)
                  setSelectedTables([table])
                }
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="table-none" />
                <Label htmlFor="table-none" className="cursor-pointer font-normal">
                  ไม่จองโต๊ะ
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="book" id="table-book" disabled={!table} />
                <Label htmlFor="table-book" className="cursor-pointer font-normal">
                  จองโต๊ะ
                </Label>
                {bookTableOption === 'book' && table && (
                  <div className="flex items-center gap-2 pl-2">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={tableCount}
                      onChange={(e) => setTableCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                      className="w-20 min-h-9 text-base"
                    />
                    <span className="text-sm text-gray-600">ตัว</span>
                  </div>
                )}
              </div>
            </RadioGroup>
            {bookTableOption === 'book' && table && (
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <p className="text-sm font-medium text-gray-700">โต๊ะที่เลือก</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTables.map((t, i) => (
                    <span key={t.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-sm">
                      <strong>ตัวที่ {i + 1}:</strong> {t.label}
                    </span>
                  ))}
                </div>
                {selectedTables.length >= 2 && (
                  <div className="space-y-2">
                    {selectedTables.slice(1).map((t, i) => {
                      const opts = [t, ...availableForDropdown]
                      return (
                        <div key={`slot-${i + 2}`} className="flex flex-wrap items-center gap-2">
                          <Label className="text-sm w-20 shrink-0">ตัวที่ {i + 2}</Label>
                          <select
                            value={t.id}
                            onChange={(e) => {
                              const id = parseInt(e.target.value, 10)
                              const pick = opts.find(x => x.id === id)
                              if (!pick) return
                              setSelectedTables(prev => {
                                const out = [...prev]
                                out[i + 1] = pick
                                return out
                              })
                            }}
                            className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">-- เลือกโต๊ะที่ว่าง --</option>
                            {opts.map((tbl) => (
                              <option key={tbl.id} value={tbl.id}>
                                {tbl.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 4: ข้อมูลการชำระเงิน - แสดงเสมอ (ซื้อเสื้อ/บริจาคอย่างเดียวก็เห็นยอด) */}
          <section
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
            aria-labelledby="section-payment"
          >
            <h2 id="section-payment" className="text-base font-semibold text-gray-900">
              ข้อมูลการชำระเงิน
            </h2>
            
            {isBookingTable && (
              <div className="flex justify-between text-sm">
                <span>ราคาโต๊ะ{selectedTables.length > 1 ? ` (${selectedTables.length} ตัว)` : ''}</span>
                <span>{(BASE_PRICE * Math.max(1, selectedTables.length)).toLocaleString()} บาท</span>
              </div>
            )}
            {shirtTotal > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>เสื้อที่ระลึก ({totalShirtQuantity} ตัว)</span>
                <span>+{shirtTotal.toLocaleString()} บาท</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>ค่าส่งเสื้อ 50 บาท</span>
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

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-500 mb-2">สแกน QR Code เพื่อชำระเงิน</p>
              <div className="w-48 h-auto mx-auto">
                <Image
                  src="/qr-codepp.png"
                  alt="PromptPay QR Code"
                  width={192}
                  height={240}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">PromptPay e-Donation ลดหย่อนภาษี</p>
            </div>
          </section>

          {/* Section 5: อัปโหลดสลิป - แสดงเสมอทั้งจองโต๊ะและไม่จองโต๊ะ */}
          <section
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
            aria-labelledby="section-slip"
          >
            <h2 id="section-slip" className="text-base font-semibold text-gray-900">
              {isBookingTable
                ? 'อัปโหลดสลิปการโอนเงิน *'
                : totalAmount > 0
                  ? 'แนบหลักฐานการโอน *'
                  : 'แนบหลักฐานการโอน (ไม่บังคับ)'}
            </h2>
            <p className="text-sm text-gray-600">
              {isBookingTable
                ? 'อัปโหลดสลิปก่อนยืนยันการจอง'
                : totalAmount > 0
                  ? 'กรุณาอัปโหลดสลิปแนบหลักฐานการโอนก่อนยืนยัน'
                  : 'อัปโหลดสลิปแนบหลักฐานการโอน (เมื่อมียอดชำระ)'}
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="slip"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="slip" className="cursor-pointer">
                {slipPreview ? (
                  <div className="relative">
                    <Image
                      src={slipPreview}
                      alt="Slip preview"
                      width={200}
                      height={200}
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <Badge variant="secondary" className="mt-2">
                      คลิกเพื่อเปลี่ยนรูป
                    </Badge>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลดสลิป</p>
                    <p className="text-xs text-gray-400">รองรับ JPG, PNG, WebP ไม่เกิน 5 MB</p>
                  </div>
                )}
              </label>
            </div>
          </section>

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
              disabled={
                (isBookingTable && (bookingMutation.isPending || isUploading || !slipFile)) ||
                (!isBookingTable && (
                  registrationMutation.isPending ||
                  isUploading ||
                  (totalAmount > 0 && !slipFile)
                ))
              }
            >
              {(isBookingTable && (bookingMutation.isPending || isUploading)) || (!isBookingTable && (registrationMutation.isPending || isUploading)) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isBookingTable ? 'ยืนยันการจอง' : 'ยืนยัน'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
