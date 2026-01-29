'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Phone, Heart } from 'lucide-react'
import Link from 'next/link'
import { TABLE_BASE_PRICE } from '@/lib/constants'

export default function DetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      {/* Header - mobile-first */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="min-h-11 touch-manipulation">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าจอง
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content - mobile-first */}
      <main className="max-w-4xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-rose-100 rounded-full mb-3 sm:mb-4">
            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2 sm:text-4xl">
            คืนถิ่นชาพัฒนาบ้านเกิดครั้งที่ 10 (พญาไพรโดม)
          </h1>
          <p className="text-base text-gray-600 sm:text-lg">
            งานเลี้ยงสังสรรค์และการกุศล
          </p>
        </div>

        {/* Event Details - single column on mobile */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                วันและเวลา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-800">เร็วๆ นี้</p>
              <p className="text-gray-600">กรุณาติดตามข้อมูลเพิ่มเติม</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                สถานที่
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-800">จะแจ้งให้ทราบภายหลัง</p>
              <p className="text-gray-600">กรุณาติดตามข้อมูลเพิ่มเติม</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                จำนวนโต๊ะ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-800">117 โต๊ะ</p>
              <p className="text-gray-600">ราคาโต๊ะละ {TABLE_BASE_PRICE.toLocaleString()} บาท</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-rose-500" />
                ติดต่อสอบถาม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-800">082-781-5307</p>
              <p className="text-gray-600">สอบถามข้อมูลเพิ่มเติม</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>รายละเอียดของงาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              คืนถิ่นชาพัฒนาบ้านเกิดครั้งที่ 10 (พญาไพรโดม) เป็นงานเลี้ยงสังสรรค์และการกุศล 
              ที่จัดขึ้นเพื่อรวมตัวศิษย์เก่าและผู้มีจิตศรัทธา มาร่วมสนุกสนานและทำบุญร่วมกัน
            </p>
            <p className="text-gray-700 leading-relaxed">
              รายได้ส่วนหนึ่งจากการจัดงานจะนำไปสนับสนุนกิจกรรมการกุศลต่างๆ
            </p>
          </CardContent>
        </Card>

        {/* CTA - touch-friendly on mobile */}
        <div className="text-center pt-2">
          <Link href="/" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="min-h-12 w-full px-8 text-base touch-manipulation sm:w-auto">
              จองโต๊ะเลย
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer - mobile-first */}
      <footer className="bg-white border-t mt-6 sm:mt-8 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-500">
          <p>ระบบจองโต๊ะ คืนถิ่นชาพัฒนาบ้านเกิดครั้งที่ 10 (พญาไพรโดม)</p>
          <p className="mt-1">สอบถามข้อมูลเพิ่มเติมที่ 082-781-5307</p>
        </div>
      </footer>
    </div>
  )
}
