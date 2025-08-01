import { useState, useEffect, useCallback } from 'react'
import { type Assets, type MonthlyData } from '@/contexts/budget-context'

export function useBudgetData() {
  const [assets, setAssets] = useState<Assets>({
    cash: [],
    stocks: [],
    realEstate: [],
    debt: []
  })
  
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: MonthlyData }>({})
  const [variableExpenseCategories, setVariableExpenseCategories] = useState<string[]>([])
  
  // 자산 데이터 로드 (누적 자산 사용)
  const loadAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/accumulated-assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      } else {
        // 누적 자산이 없으면 초기 자산에서 복사
        const initialResponse = await fetch('/api/assets')
        if (initialResponse.ok) {
          const initialData = await initialResponse.json()
          if (initialData.isSaved) {
            // 초기 자산을 누적 자산으로 복사
            const copyResponse = await fetch('/api/accumulated-assets', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialData)
            })
            if (copyResponse.ok) {
              setAssets(initialData)
            }
          } else {
            setAssets(initialData)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
      // 데이터베이스 연결 실패 시 빈 자산으로 설정
      setAssets({
        cash: [],
        stocks: [],
        realEstate: [],
        debt: []
      })
    }
  }, [])
  
  // 월별 데이터 로드
  const loadMonthlyData = useCallback(async (year: number, month: number) => {
    try {
      const response = await fetch(`/api/monthly?year=${year}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        const key = `${year}-${String(month).padStart(2, '0')}`
        setMonthlyData(prev => ({
          ...prev,
          [key]: data
        }))
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error)
      // 데이터베이스 연결 실패 시 기본 월별 데이터 설정
      const key = `${year}-${String(month).padStart(2, '0')}`
      setMonthlyData(prev => ({
        ...prev,
        [key]: {
          year,
          month,
          income: { husband: [], wife: [] },
          savings: [],
          fixedExpenses: [],
          variableExpenses: {},
          stockTransactions: { buy: [], sell: [] },
          debtPayments: [],
          netWorth: 0
        }
      }))
    }
  }, [])
  
  // 카테고리 데이터 로드
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setVariableExpenseCategories(data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      // 데이터베이스 연결 실패 시 빈 카테고리로 설정
      setVariableExpenseCategories([])
    }
  }, [])
  
  // 자산 업데이트 (누적 자산 저장)
  const updateAssets = useCallback(async (newAssets: Assets) => {
    setAssets(newAssets)
    
    // 누적 자산을 데이터베이스에 저장
    try {
      await fetch('/api/accumulated-assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssets)
      })
    } catch (error) {
      console.error('Failed to update accumulated assets:', error)
    }
  }, [])
  
  // 월별 데이터 저장
  const saveMonthlyData = useCallback(async (year: number, month: number, data: MonthlyData) => {
    try {
      console.log('Saving monthly data:', { year, month, data, assets })
      
      const response = await fetch('/api/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month,
          monthlyData: data,
          currentAssets: assets
        }),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        
        const key = `${year}-${String(month).padStart(2, '0')}`
        const dataWithSnapshots = {
          ...data,
          assetSnapshots: assets
        }
        setMonthlyData(prev => ({
          ...prev,
          [key]: dataWithSnapshots
        }))
        return true
      } else {
        const errorData = await response.json()
        console.error('Save failed:', errorData)
        return false
      }
    } catch (error) {
      console.error('Failed to save monthly data:', error)
      return false
    }
  }, [assets])
  
  // 카테고리 추가
  const addCategory = useCallback(async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      
      if (response.ok) {
        setVariableExpenseCategories(prev => [...prev, name])
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to add category:', error)
      return false
    }
  }, [])
  
  // 카테고리 삭제
  const deleteCategory = useCallback(async (name: string) => {
    try {
      const response = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setVariableExpenseCategories(prev => prev.filter(cat => cat !== name))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete category:', error)
      return false
    }
  }, [])
  
  // 초기 데이터 로드
  useEffect(() => {
    loadAssets()
    loadCategories()
  }, [])
  
  return {
    assets,
    monthlyData,
    variableExpenseCategories,
    loadAssets,
    loadMonthlyData,
    loadCategories,
    updateAssets,
    saveMonthlyData,
    addCategory,
    deleteCategory
  }
}