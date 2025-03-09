'use client'

import * as React from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock } from 'lucide-react'

interface TelegramDatePickerProps {
  date: Date
  setDate: (date: Date) => void
  label?: string
}

export function TelegramDatePicker({ date, setDate, label = "Date & Time" }: TelegramDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date(date))
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(date)
    newDate.setFullYear(currentMonth.getFullYear())
    newDate.setMonth(currentMonth.getMonth())
    newDate.setDate(day)
    setDate(newDate)
  }

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

  // Generate calendar days
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const days = []
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
          {weekdays[i]}
        </div>
      )
    }
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = 
        date.getDate() === day && 
        date.getMonth() === month && 
        date.getFullYear() === year
      
      const isToday = 
        new Date().getDate() === day && 
        new Date().getMonth() === month && 
        new Date().getFullYear() === year
      
      days.push(
        <button
          key={`day-${day}`}
          onClick={() => handleDateSelect(day)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm
            ${isSelected ? 'bg-blue-500 hover:bg-blue-600' : ''}
            ${isToday && !isSelected ? 'bg-gray-700' : ''}
            ${!isSelected && !isToday ? 'hover:bg-gray-700' : ''}
          `}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

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
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-gray-700"
              >
                <span className="h-5 w-5 text-gray-400">←</span>
              </button>
              
              <div className="text-white font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-gray-700"
              >
                <span className="h-5 w-5 text-gray-400">→</span>
              </button>
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
          
          {/* Time picker */}
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