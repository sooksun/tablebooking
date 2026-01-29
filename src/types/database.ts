export type TableStatus = 'AVAILABLE' | 'PENDING' | 'BOOKED'

export type BookingStatus = 
  | 'PENDING_VERIFICATION' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'WAITING_LIST' 
  | 'CANCELLED_BY_SYSTEM'

export interface Table {
  id: number
  label: string
  status: TableStatus
  current_queue_count: number
  created_at: string
}

export interface Booking {
  id: string
  table_id: number
  user_name: string
  phone: string
  amount: number
  slip_url: string | null
  status: BookingStatus
  queue_position: number
  memo: string | null
  created_at: string
  checked_in_at: string | null
  food_received_at: string | null
  // Joined data
  table?: Table
}

export interface RegistrationShirtOrder {
  type: 'crew' | 'polo'
  size: string
  quantity: number
}

export interface Registration {
  id: string
  user_name: string
  phone: string
  donation: number
  shirt_orders: RegistrationShirtOrder[]
  shirt_delivery: 'pickup' | 'delivery'
  shirt_delivery_address: string | null
  e_donation_want: boolean
  e_donation_name: string | null
  e_donation_address: string | null
  e_donation_id: string | null
  total_amount: number
  slip_url: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      tables: {
        Row: Table
        Insert: Omit<Table, 'created_at'>
        Update: Partial<Omit<Table, 'id' | 'created_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at' | 'table'>
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'table'>>
      }
    }
  }
}
