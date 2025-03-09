'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react'
import { FiUpload } from 'react-icons/fi'
import { TelegramDatePicker } from "@/components/ui/TelegramDatePicker"

interface ScheduledMessage {
  id: string;
  message_text?: string;
  media?: string;
  starting_at: number;
  interval: number;
  enabled: boolean;
}

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
  editingMessage: ScheduledMessage | null
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
  // Check if form can be submitted (has message or media AND valid interval)
  const hasContent = !!newMessage || !!mediaFile;
  const hasValidInterval = !isNaN(parseInt(interval)) && parseInt(interval) > 0;
  const canSubmit = hasContent && hasValidInterval;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <TelegramDatePicker
          date={startDate}
          setDate={setStartDate}
          label="Start Date & Time"
        />

        <div>
          <Label className="text-gray-300">Interval (minutes)</Label>
          <Input
            type="number"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            min="1"
            className="bg-[#374151] border-gray-600 text-white"
          />
          {!hasValidInterval && interval !== '' && (
            <p className="text-amber-400 text-sm mt-2">
              Please enter a valid interval greater than 0
            </p>
          )}
        </div>

        <div>
          <Label className="text-gray-300">Message</Label>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="bg-[#374151] border-gray-600 text-white min-h-[120px]"
          />
          {!hasContent && (
            <p className="text-amber-400 text-sm mt-2">
              Please enter a message or select a media file to schedule
            </p>
          )}
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
          disabled={isSubmitting || !canSubmit}
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