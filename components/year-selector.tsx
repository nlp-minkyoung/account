"use client"

import { useBudget } from "@/contexts/budget-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function YearSelector() {
  const { currentYear, setCurrentYear } = useBudget()

  return (
    <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
      <SelectTrigger className="w-32 border-2 border-blue-200 focus:border-blue-300 rounded-lg">
        <SelectValue placeholder="연도 선택" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 5 }, (_, i) => {
          const year = new Date().getFullYear() - 2 + i
          return (
            <SelectItem key={year} value={year.toString()}>
              {year}년
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}