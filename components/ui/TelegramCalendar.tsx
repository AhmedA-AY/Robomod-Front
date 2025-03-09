"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { MessageSquare } from "lucide-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function TelegramCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        root: "w-full",
        months: "w-full",
        month: "w-full space-y-2",
        caption: "flex justify-center pt-2 pb-2 relative items-center",
        caption_label: "text-base font-medium text-white",
        nav: "flex items-center",
        nav_button: "h-8 w-8 bg-transparent p-0 text-white opacity-80 hover:opacity-100 flex items-center justify-center after:content-['←'] after:text-lg",
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2 after:content-['→']",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: "text-gray-400 w-10 font-normal text-sm rounded-md text-center",
        row: "flex w-full mt-1",
        cell: "text-center relative p-0 [&:has([aria-selected])]:bg-blue-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-10 w-10 p-0 font-normal text-white aria-selected:opacity-100 flex items-center justify-center rounded-full mx-auto",
        day_selected: "bg-blue-500 text-white hover:bg-blue-600",
        day_today: "bg-gray-700 text-white",
        day_outside: "text-gray-500 opacity-50",
        day_disabled: "text-gray-500 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
} 