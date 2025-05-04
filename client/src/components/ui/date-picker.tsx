import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | Date[] | undefined;
  onSelect?: (date: Date | Date[] | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  placeholder = "Pick a date"
}: DatePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? (
              mode === "single" ? (
                format(selected as Date, "PPP")
              ) : mode === "range" ? (
                ` ${format((selected as Date[])[0], "PPP")} - ${format((selected as Date[])[1], "PPP")}`
              ) : (
                `${(selected as Date[]).length} dates selected`
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode={mode}
            selected={selected}
            onSelect={onSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}