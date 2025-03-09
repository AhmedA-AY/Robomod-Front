'use client'

import * as React from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock } from 'lucide-react'
import { TelegramCalendar } from "./TelegramCalendar"

interface TelegramDatePickerProps {
  date: Date
  setDate: (date: Date) => void
  label?: string
}

export function TelegramDatePicker({ date, setDate, label = "Date & Time" }: TelegramDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':')
    const newDate = new Date(date)
    newDate.setHours(parseInt(hours))
    newDate.setMinutes(parseInt(minutes))
    setDate(newDate)
  }

  // Close the calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full" ref={containerRef}>
      <Label className="text-gray-300">{label}</Label>
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal bg-[#374151] border-gray-600 text-white hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="mr-2 h-4 w-4" />
        {format(date, "PPP p")}
      </Button>
      
      {isOpen && (
        <div 
          className="absolute z-[9999] mt-1 bg-[#2d3748] border border-gray-600 rounded-md shadow-lg"
          style={{ 
            width: '300px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
          }}
        >
          <div className="p-3">
            <TelegramCalendar
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate)
                setIsOpen(false)
              }}
              initialFocus
            />
          </div>
          
          <div className="p-3 border-t border-gray-600">
            <Input
              type="time"
              value={format(date, "HH:mm")}
              onChange={handleTimeChange}
              className="bg-[#374151] border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
} 