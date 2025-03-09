'use client'

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Loader2 } from 'lucide-react'
import { FiUpload } from 'react-icons/fi'

interface ScheduleFormProps {
  startDate: Date
  setStartDate: (date: Date) => void
  interval: string
  setInterval: (interval: string) => void
  newMessage: string
  setNewMessage: (message: string) => void
  mediaFile: File | null
  setMediaFile: (file: File | null) => void
  isSubmitting: boolean
  editingMessage: any
  onSubmit: (e: React.FormEvent) => void
}

export function ScheduleForm({
  startDate,
  setStartDate,
  interval,
  setInterval,
  newMessage,
  setNewMessage,
  mediaFile,
  setMediaFile,
  isSubmitting,
  editingMessage,
  onSubmit
}: ScheduleFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Label className="text-gray-300">Start Date & Time</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-[#374151] border-gray-600 text-white hover:bg-gray-700"
              >
                <Clock className="mr-2 h-4 w-4" />
                {format(startDate, "PPP p")}
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
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                className="rounded-t-md"
              />
              <div className="p-3 border-t border-gray-600">
                <Input
                  type="time"
                  value={format(startDate, "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':')
                    const newDate = new Date(startDate)
                    newDate.setHours(parseInt(hours))
                    newDate.setMinutes(parseInt(minutes))
                    setStartDate(newDate)
                  }}
                  className="bg-[#374151] border-gray-600 text-white"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-gray-300">Interval (minutes)</Label>
          <Input
            type="number"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            min="1"
            className="bg-[#374151] border-gray-600 text-white"
          />
        </div>

        <div>
          <Label className="text-gray-300">Message</Label>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="bg-[#374151] border-gray-600 text-white min-h-[120px]"
          />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="file"
            id="media"
            className="hidden"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('media')?.click()}
            className="w-full bg-[#374151] border-gray-600 text-white hover:bg-gray-700"
          >
            <FiUpload className="w-4 h-4 mr-2" />
            {mediaFile ? mediaFile.name : 'Upload Media'}
          </Button>
        </div>
        <Button 
          type="submit" 
          disabled={isSubmitting || (!newMessage && !mediaFile)}
          className="min-w-[140px] bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-600"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editingMessage ? (
            'Update Message'
          ) : (
            'Schedule Message'
          )}
        </Button>
      </div>
    </form>
  )
} 