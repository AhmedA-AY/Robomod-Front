'use client'

import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize client-side only to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setCurrentMonth(new Date(date));
  }, [date]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    if (!currentMonth) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    if (!currentMonth) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateSelect = (day: number) => {
    if (!currentMonth) return;
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
  useEffect(() => {
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
    if (!currentMonth) return [];
    
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const days = []
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="w-10 h-10 flex items-center justify-center text-sm" 
             style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
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
          type="button"
          onClick={() => handleDateSelect(day)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
          style={{
            backgroundColor: isSelected ? 'var(--tg-theme-button-color, #3b82f6)' : 
                             isToday ? 'var(--tg-theme-secondary-bg-color, #374151)' : 'transparent',
            color: isSelected ? 'var(--tg-theme-button-text-color, white)' : 'var(--tg-theme-text-color, white)'
          }}
        >
          {day}
        </button>
      )
    }
    
    return days
  }
  
  // Only render when mounted (client-side)
  if (!isMounted) {
    return (
      <div className="relative w-full">
        <Label style={{ color: 'var(--tg-theme-text-color, #d1d5db)' }}>{label}</Label>
        <div className="h-10 rounded-md" style={{ 
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
          borderColor: 'var(--tg-theme-hint-color, #4b5563)',
          border: '1px solid'
        }}></div>
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <Label style={{ color: 'var(--tg-theme-text-color, #d1d5db)' }}>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal hover:bg-opacity-70"
        style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
          borderColor: 'var(--tg-theme-hint-color, #4b5563)',
          color: 'var(--tg-theme-text-color, white)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="mr-2 h-4 w-4" />
        {format(date, "PPP p")}
      </Button>
      
      {isOpen && currentMonth && (
        <div 
          className="absolute z-[9999] mt-1 rounded-md shadow-lg"
          style={{ 
            width: '300px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            backgroundColor: 'var(--tg-theme-bg-color, #2d3748)',
            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
            border: '1px solid'
          }}
        >
          <div className="p-3">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-opacity-70"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'var(--tg-theme-hint-color, #a0aec0)'
                }}
              >
                <span className="h-5 w-5">←</span>
              </button>
              
              <div style={{ color: 'var(--tg-theme-text-color, white)' }} className="font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-opacity-70"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'var(--tg-theme-hint-color, #a0aec0)'
                }}
              >
                <span className="h-5 w-5">→</span>
              </button>
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
          
          {/* Time picker */}
          <div className="p-3" style={{ borderTop: '1px solid var(--tg-theme-hint-color, #4b5563)' }}>
            <Input
              type="time"
              value={format(date, "HH:mm")}
              onChange={handleTimeChange}
              className="focus:ring-1 focus:ring-[var(--tg-theme-button-color,#3b82f6)]"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
                borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                color: 'var(--tg-theme-text-color, white)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 