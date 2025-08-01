"use client"

import { useBudget } from "@/contexts/budget-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MonthSelector() {
  const { currentYear, currentMonth, setCurrentMonth } = useBudget()

  // 월 선택 옵션 생성
  const generateMonthOptions = () => {
    const options = []

    // 1월부터 12월까지의 월 옵션 생성
    for (let month = 1; month <= 12; month++) {
      const value = `${currentYear}-${String(month).padStart(2, "0")}`
      const label = `${month}월`
      options.push({ value, label })
    }

    return options
  }

  return (
    <Select value={currentMonth} onValueChange={setCurrentMonth}>
      <SelectTrigger className="w-32 border-2 border-pink-200 focus:border-pink-300 rounded-lg">
        <SelectValue placeholder="월 선택" />
      </SelectTrigger>
      <SelectContent>
        {generateMonthOptions().map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}