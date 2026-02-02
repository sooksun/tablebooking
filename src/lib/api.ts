import { supabase } from './supabase'
import { TABLE_BASE_PRICE } from './constants'
import type { Table, Booking, BookingStatus, Registration, RegistrationShirtOrder, BookingShirtOrder } from '@/types/database'

// Fetch all tables with their booking counts and current booking info
export async function fetchTables(): Promise<(Table & { current_booking?: Booking })[]> {
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .order('id', { ascending: true })

  if (tablesError) throw tablesError

  // Fetch all active bookings (PENDING_VERIFICATION or APPROVED)
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .in('status', ['PENDING_VERIFICATION', 'APPROVED'])
    .order('created_at', { ascending: false })

  if (bookingsError) throw bookingsError

  // Map bookings to tables
  const tablesWithBookings = (tables as Table[]).map(table => {
    const booking = (bookings as Booking[]).find(
      b => b.table_id === table.id && 
      (b.status === 'PENDING_VERIFICATION' || b.status === 'APPROVED')
    )
    return {
      ...table,
      current_booking: booking
    }
  })

  return tablesWithBookings
}

// Fetch bookings for a specific table
export async function fetchTableBookings(tableId: number): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('table_id', tableId)
    .order('queue_position', { ascending: true })

  if (error) throw error
  return data as Booking[]
}

// Fetch all pending bookings (for admin)
export async function fetchPendingBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, table:tables(*)')
    .eq('status', 'PENDING_VERIFICATION')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Booking[]
}

// Fetch all bookings (for admin)
export async function fetchAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, table:tables(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

// Fetch approved bookings by phone (for "ดูตั๋วของฉัน" – owner-only via phone as password)
export async function fetchBookingsByPhone(phone: string): Promise<Booking[]> {
  const normalized = phone.replace(/\D/g, '')
  if (!normalized || normalized.length < 9) throw new Error('กรุณากรอกเบอร์โทรให้ถูกต้อง')

  const { data, error } = await supabase
    .from('bookings')
    .select('*, table:tables(*)')
    .eq('phone', normalized)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as Booking[]
}

export interface CreateBookingInput {
  tableId: number
  userName: string
  phone: string
  amount: number
  slipUrl: string
  donation?: number
  shirtOrders?: BookingShirtOrder[]
  shirtDelivery?: 'pickup' | 'delivery'
  shirtDeliveryAddress?: string
  eDonationWant?: boolean
  eDonationName?: string
  eDonationAddress?: string
  eDonationId?: string
}

// Create a new booking (1 table = 1 person only)
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const { tableId, userName, phone, amount, slipUrl } = input
  
  if (amount < TABLE_BASE_PRICE) {
    throw new Error('ยอดชำระไม่ถูกต้อง')
  }
  // Check if table is available
  const { data: tableData, error: tableError } = await supabase
    .from('tables')
    .select('status, current_queue_count')
    .eq('id', tableId)
    .single()

  if (tableError) throw tableError
  
  const table = tableData as { status: string; current_queue_count: number }
  
  // Check if table is already booked or has pending booking
  if (table.status === 'BOOKED') {
    throw new Error('โต๊ะนี้ถูกจองแล้ว')
  }
  if (table.current_queue_count >= 1) {
    throw new Error('โต๊ะนี้มีคนจองรออนุมัติอยู่แล้ว')
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      table_id: tableId,
      user_name: userName,
      phone,
      amount,
      slip_url: slipUrl,
      status: 'PENDING_VERIFICATION',
      queue_position: 1,
      donation: input.donation || 0,
      shirt_orders: input.shirtOrders || [],
      shirt_delivery: input.shirtDelivery || null,
      shirt_delivery_address: input.shirtDeliveryAddress?.trim() || null,
      e_donation_want: input.eDonationWant || false,
      e_donation_name: input.eDonationWant ? (input.eDonationName?.trim() || null) : null,
      e_donation_address: input.eDonationWant ? (input.eDonationAddress?.trim() || null) : null,
      e_donation_id: input.eDonationWant ? (input.eDonationId?.trim() || null) : null,
    })
    .select()
    .single()

  if (bookingError) throw bookingError

  // Update table status to PENDING
  const { error: updateError } = await supabase
    .from('tables')
    .update({ 
      status: 'PENDING',
      current_queue_count: 1 
    })
    .eq('id', tableId)

  if (updateError) throw updateError

  return booking as Booking
}

const SLIP_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SLIP_MAX_BYTES = 5 * 1024 * 1024 // 5MB

// Upload slip image
export async function uploadSlip(file: File): Promise<string> {
  if (!SLIP_ALLOWED_TYPES.includes(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP')
  }
  if (file.size > SLIP_MAX_BYTES) {
    throw new Error('ขนาดไฟล์เกิน 5 MB')
  }
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${safeExt}`

  const { error } = await supabase.storage
    .from('slips')
    .upload(fileName, file)

  if (error) throw error

  const { data } = supabase.storage.from('slips').getPublicUrl(fileName)
  return data.publicUrl
}

// Admin: Approve booking
export async function approveBooking(bookingId: string): Promise<void> {
  // Get the booking
  const { data: bookingData, error: getError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (getError) throw getError
  
  const booking = bookingData as Booking

  // Update booking to APPROVED
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'APPROVED' })
    .eq('id', bookingId)

  if (updateError) throw updateError

  // Update table status to BOOKED
  const { error: tableError } = await supabase
    .from('tables')
    .update({ status: 'BOOKED' })
    .eq('id', booking.table_id)

  if (tableError) throw tableError
}

// Admin: Reject booking (table becomes available again)
export async function rejectBooking(bookingId: string): Promise<void> {
  // Get the booking
  const { data: bookingData, error: getError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (getError) throw getError
  
  const booking = bookingData as Booking

  // Update booking to REJECTED
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'REJECTED' })
    .eq('id', bookingId)

  if (updateError) throw updateError

  // Reset table to AVAILABLE (no queue system anymore)
  const { error: resetError } = await supabase
    .from('tables')
    .update({ 
      status: 'AVAILABLE',
      current_queue_count: 0 
    })
    .eq('id', booking.table_id)

  if (resetError) throw resetError
}

// Admin: Update booking memo
export async function updateBookingMemo(bookingId: string, memo: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ memo: memo || null })
    .eq('id', bookingId)

  if (error) throw error
}

export interface UpdateBookingDetailsInput {
  bookingId: string
  userName?: string
  phone?: string
  donation?: number
  shirtOrders?: BookingShirtOrder[]
  shirtDelivery?: 'pickup' | 'delivery' | null
  shirtDeliveryAddress?: string | null
  eDonationWant?: boolean
  eDonationName?: string | null
  eDonationAddress?: string | null
  eDonationId?: string | null
}

export async function updateBookingDetails(input: UpdateBookingDetailsInput): Promise<void> {
  const updateData: Record<string, unknown> = {}
  
  if (input.userName !== undefined) updateData.user_name = input.userName.trim()
  if (input.phone !== undefined) updateData.phone = input.phone.replace(/\D/g, '')
  if (input.donation !== undefined) updateData.donation = Math.max(0, input.donation)
  if (input.shirtOrders !== undefined) updateData.shirt_orders = input.shirtOrders
  if (input.shirtDelivery !== undefined) updateData.shirt_delivery = input.shirtDelivery
  if (input.shirtDeliveryAddress !== undefined) updateData.shirt_delivery_address = input.shirtDeliveryAddress?.trim() || null
  if (input.eDonationWant !== undefined) updateData.e_donation_want = input.eDonationWant
  if (input.eDonationName !== undefined) updateData.e_donation_name = input.eDonationName?.trim() || null
  if (input.eDonationAddress !== undefined) updateData.e_donation_address = input.eDonationAddress?.trim() || null
  if (input.eDonationId !== undefined) updateData.e_donation_id = input.eDonationId?.trim() || null

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', input.bookingId)

  if (error) throw error
}

// Check-in: ลงทะเบียนเข้างาน (สแกน QR บนตั๋ว)
export async function checkIn(bookingId: string): Promise<Booking> {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, table:tables(*)')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) throw new Error('ไม่พบการจอง')
  const b = booking as Booking & { checked_in_at: string | null }
  if (b.status !== 'APPROVED') throw new Error('การจองยังไม่อนุมัติ')
  if (b.checked_in_at) throw new Error('ลงทะเบียนเข้างานแล้ว')

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select('*, table:tables(*)')
    .single()

  if (updateError) throw updateError
  return updated as Booking
}

// ยืนยันการรับอาหารของโต๊ะ (ฝ่ายบริการ)
export async function confirmFoodReceived(bookingId: string): Promise<Booking> {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, table:tables(*)')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) throw new Error('ไม่พบการจอง')
  const b = booking as Booking & { checked_in_at: string | null; food_received_at: string | null }
  if (b.status !== 'APPROVED') throw new Error('การจองยังไม่อนุมัติ')
  if (!b.checked_in_at) throw new Error('ต้องเข้างานก่อน จึงจะยืนยันการรับอาหารได้')
  if (b.food_received_at) throw new Error('ยืนยันการรับอาหารของโต๊ะนี้แล้ว')

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ food_received_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select('*, table:tables(*)')
    .single()

  if (updateError) throw updateError
  return updated as Booking
}

// --- ลงทะเบียนแบบไม่จองโต๊ะ (Registrations) ---

export interface CreateRegistrationInput {
  user_name: string
  phone: string
  donation: number
  shirt_orders: RegistrationShirtOrder[]
  shirt_delivery: 'pickup' | 'delivery'
  shirt_delivery_address: string
  e_donation_want: boolean
  e_donation_name: string
  e_donation_address: string
  e_donation_id: string
  total_amount: number
  slip_url: string | null
}

export async function createRegistration(input: CreateRegistrationInput): Promise<Registration> {
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      user_name: input.user_name.trim(),
      phone: input.phone.replace(/\D/g, ''),
      donation: Math.max(0, input.donation),
      shirt_orders: input.shirt_orders,
      shirt_delivery: input.shirt_delivery,
      shirt_delivery_address: input.shirt_delivery_address?.trim() || null,
      e_donation_want: input.e_donation_want,
      e_donation_name: input.e_donation_want ? (input.e_donation_name?.trim() || null) : null,
      e_donation_address: input.e_donation_want ? (input.e_donation_address?.trim() || null) : null,
      e_donation_id: input.e_donation_want ? (input.e_donation_id?.trim() || null) : null,
      total_amount: Math.max(0, input.total_amount),
      slip_url: input.slip_url || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Registration
}

export async function fetchRegistrations(): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    shirt_orders: (row.shirt_orders as RegistrationShirtOrder[]) || [],
  })) as Registration[]
}
