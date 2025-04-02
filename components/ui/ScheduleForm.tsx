'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react'
import { FiUpload } from 'react-icons/fi'
import { TelegramDatePicker } from "@/components/ui/TelegramDatePicker"

interface ScheduledMessage {
  schedule_id: string;
  chat_id: number;
  message_id: number;
  enabled: boolean;
  type: string;
  starting_at: number;
  interval: number;
  last_run: number;
  next_run: number;
  message_text?: string;
  media?: string;
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
  isEnabled: boolean
  setIsEnabled: (enabled: boolean) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

// Define max file size (1MB in bytes)
const MAX_FILE_SIZE = 1 * 1024 * 1024;

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
  isEnabled,
  setIsEnabled,
  onSubmit
}: ScheduleFormProps) {
  // Add client-side only state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // Only initialize client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only require valid interval for form submission
  const hasValidInterval = !isNaN(parseInt(interval)) && parseInt(interval) > 0;
  const canSubmit = hasValidInterval;
  
  // Create a ref for the file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Function to handle file input changes with size validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        e.target.value = ''; // Reset the input
        return;
      }
      setMediaFile(file);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return <div className="p-4">Loading form...</div>;
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(e);
    }} className="space-y-6" encType="multipart/form-data">
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
        </div>

        {editingMessage && (
          <div className="flex items-center gap-2">
            <Label className="text-gray-300">Status</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isEnabled ? "default" : "outline"}
                onClick={() => setIsEnabled(true)}
                className={`${isEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-[#374151] border-gray-600 text-white hover:bg-gray-700'}`}
              >
                Active
              </Button>
              <Button
                type="button"
                variant={!isEnabled ? "default" : "outline"}
                onClick={() => setIsEnabled(false)}
                className={`${!isEnabled ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#374151] border-gray-600 text-white hover:bg-gray-700'}`}
              >
                Inactive
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit"}
        </Button>
      </div>
    </form>
  )
}