'use client'

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock } from 'lucide-react'

interface DateTimePickerProps {
  date: Date
  setDate: (date: Date) => void
  label?: string
}

export function DateTimePicker({ date, setDate, label = "Date & Time" }: DateTimePickerProps) {
  return (
    <div className="relative w-full">
      <Label className="text-gray-300">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-[#374151] border-gray-600 text-white hover:bg-gray-700"
          >
            <Clock className="mr-2 h-4 w-4" />
            {format(date, "PPP p")}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-[#2d3748] border-gray-600" 
          align="start"
          side="bottom"
          sideOffset={5}
          style={{ 
            position: 'fixed',
            zIndex: 1001,
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            initialFocus
            className="rounded-t-md"
          />
          <div className="p-3 border-t border-gray-600">
            <Input
              type="time"
              value={format(date, "HH:mm")}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':')
                const newDate = new Date(date)
                newDate.setHours(parseInt(hours))
                newDate.setMinutes(parseInt(minutes))
                setDate(newDate)
              }}
              className="bg-[#374151] border-gray-600 text-white"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 