"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useBudgetData } from "@/hooks/use-budget-data"

export interface AssetItem {
  id: string
  name: string
  amount: number
}

export interface StockItem {
  id: string
  name: string
  quantity: number
  purchasePrice: number
  currentPrice?: number
}

export interface Assets {
  cash: AssetItem[]
  stocks: StockItem[]
  realEstate: AssetItem[]
  debt: AssetItem[]
}

export interface MonthlyData {
  year: number
  month: number
  income: {
    husband: AssetItem[]
    wife: AssetItem[]
  }
  savings: AssetItem[]
  fixedExpenses: AssetItem[]
  variableExpenses: { [category: string]: AssetItem[] }
  stockTransactions: {
    buy: StockItem[]
    sell: StockItem[]
  }
  debtPayments: AssetItem[]
  netWorth: number
  assetSnapshots?: Assets
}

interface BudgetContextType {
  assets: Assets
  setAssets: (assets: Assets) => void
  monthlyData: { [key: string]: MonthlyData }
  setMonthlyData: (data: { [key: string]: MonthlyData }) => void
  currentYear: number
  setCurrentYear: (year: number) => void
  currentMonth: string
  setCurrentMonth: (month: string) => void
  variableExpenseCategories: string[]
  setVariableExpenseCategories: (categories: string[]) => void
  saveMonthlyDataToDB: (year: number, month: number, data: MonthlyData) => Promise<boolean>
  loadMonthlyData: (year: number, month: number) => Promise<void>
  addCategory: (name: string) => Promise<boolean>
  deleteCategory: (name: string) => Promise<boolean>
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const {
    assets,
    monthlyData,
    variableExpenseCategories,
    updateAssets,
    saveMonthlyData,
    loadMonthlyData,
    addCategory,
    deleteCategory
  } = useBudgetData()

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  // 연도가 변경될 때 currentMonth도 업데이트
  useEffect(() => {
    const [, month] = currentMonth.split('-')
    setCurrentMonth(`${currentYear}-${month}`)
  }, [currentYear])

  // 현재 월 데이터 로드
  useEffect(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    loadMonthlyData(year, month)
  }, [currentMonth, loadMonthlyData])

  const saveMonthlyDataToDB = async (year: number, month: number, data: MonthlyData) => {
    return await saveMonthlyData(year, month, data)
  }

  return (
    <BudgetContext.Provider
      value={{
        assets,
        setAssets: updateAssets,
        monthlyData,
        setMonthlyData: () => {}, // DB 연동으로 직접 조작 방지
        currentYear,
        setCurrentYear,
        currentMonth,
        setCurrentMonth,
        variableExpenseCategories,
        setVariableExpenseCategories: () => {}, // DB 연동으로 직접 조작 방지
        saveMonthlyDataToDB,
        loadMonthlyData,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider")
  }
  return context
}
