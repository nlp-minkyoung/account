"use client"

import { useState, useEffect } from "react"
import { useBudget, type AssetItem, type StockItem, type MonthlyData } from "@/contexts/budget-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MonthlyManagement() {
  const {
    assets,
    setAssets,
    monthlyData,
    currentMonth,
    setCurrentMonth,
    variableExpenseCategories,
    saveMonthlyDataToDB,
    addCategory,
    deleteCategory,
  } = useBudget()

  const [newCategory, setNewCategory] = useState("")
  
  // 월별 독립적인 자산 상태 관리
  const [monthlyAssets, setMonthlyAssets] = useState<Assets>(assets)

  // 숫자 포맷팅 함수
  const formatNumber = (value: number): string => {
    return value.toLocaleString()
  }

  // 콤마가 포함된 문자열을 숫자로 변환
  const parseNumber = (value: string): number => {
    return Number(value.replace(/,/g, ""))
  }

  // 입력값 포맷팅 핸들러
  const handleNumberInput = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, "")
    return numericValue ? Number(numericValue).toLocaleString() : ""
  }

  // 현재 월 데이터 가져오기 또는 초기화
  const getCurrentMonthData = (): MonthlyData => {
    const [year, month] = currentMonth.split("-").map(Number)
    return (
      monthlyData[currentMonth] || {
        year,
        month,
        income: { husband: [], wife: [] },
        savings: assets.cash.filter((item) => item.name !== "파킹통장").map((item) => ({ ...item, amount: 0 })),
        fixedExpenses: [],
        variableExpenses: variableExpenseCategories.reduce(
          (acc, category) => {
            acc[category] = []
            return acc
          },
          {} as { [key: string]: AssetItem[] },
        ),
        stockTransactions: { buy: [], sell: [] },
        debtPayments: assets.debt.map((item) => ({ ...item, amount: 0 })),
        netWorth: 0,
      }
    )
  }

  const [currentData, setCurrentData] = useState<MonthlyData>(getCurrentMonthData())
  
  // 해당 월의 자산 정보 가져오기 (스냅샷이 있으면 스냅샷, 없으면 현재 자산)
  const getDisplayAssets = (): Assets => {
    const currentMonthData = monthlyData[currentMonth]
    if (currentMonthData?.assetSnapshots) {
      return currentMonthData.assetSnapshots
    }
    return assets
  }

  // currentMonth나 monthlyData가 변경될 때 currentData 업데이트
  useEffect(() => {
    setCurrentData(getCurrentMonthData())
  }, [currentMonth, monthlyData])

  // 월이 변경될 때 해당 월의 자산 상태 로드
  useEffect(() => {
    const currentMonthData = monthlyData[currentMonth]
    if (currentMonthData && currentMonthData.assetSnapshots) {
      // 해당 월에 저장된 자산 스냅샷이 있으면 사용
      setMonthlyAssets(currentMonthData.assetSnapshots)
    } else {
      // 없으면 전역 누적 자산을 복사해서 사용
      setMonthlyAssets({ ...assets })
    }
  }, [currentMonth, monthlyData, assets])


  // 새 카테고리 추가
  const addVariableExpenseCategory = async () => {
    if (newCategory && !variableExpenseCategories.includes(newCategory)) {
      const success = await addCategory(newCategory)
      if (success) {
        setCurrentData({
          ...currentData,
          variableExpenses: {
            ...currentData.variableExpenses,
            [newCategory]: [],
          },
        })
        setNewCategory("")
      }
    }
  }

  // 카테고리 삭제
  const deleteVariableExpenseCategory = async (categoryToDelete: string) => {
    const success = await deleteCategory(categoryToDelete)
    if (success) {
      const updatedExpenses = { ...currentData.variableExpenses }
      delete updatedExpenses[categoryToDelete]
      setCurrentData({
        ...currentData,
        variableExpenses: updatedExpenses,
      })
    }
  }

  // 항목 추가 함수들
  const addSavingsItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setCurrentData({
      ...currentData,
      savings: [...currentData.savings, newItem],
    })
  }

  const addFixedExpenseItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setCurrentData({
      ...currentData,
      fixedExpenses: [...currentData.fixedExpenses, newItem],
    })
  }

  const addVariableExpenseItem = (category: string) => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setCurrentData({
      ...currentData,
      variableExpenses: {
        ...currentData.variableExpenses,
        [category]: [...(currentData.variableExpenses[category] || []), newItem],
      },
    })
  }

  const addStockBuyItem = () => {
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 0,
      purchasePrice: 0,
    }
    setCurrentData({
      ...currentData,
      stockTransactions: {
        ...currentData.stockTransactions,
        buy: [...currentData.stockTransactions.buy, newItem],
      },
    })
  }

  const addStockSellItem = () => {
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 0,
      purchasePrice: 0,
    }
    setCurrentData({
      ...currentData,
      stockTransactions: {
        ...currentData.stockTransactions,
        sell: [...currentData.stockTransactions.sell, newItem],
      },
    })
  }

  const addDebtPaymentItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setCurrentData({
      ...currentData,
      debtPayments: [...currentData.debtPayments, newItem],
    })
  }

  // 수입 계산 함수 수정
  const calculateTotalIncome = () => {
    const husbandTotal = currentData.income.husband.reduce((sum, item) => sum + item.amount, 0)
    const wifeTotal = currentData.income.wife.reduce((sum, item) => sum + item.amount, 0)
    return husbandTotal + wifeTotal
  }

  // 수입 항목 추가 함수 추가
  const addHusbandIncomeItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setCurrentData({
      ...currentData,
      income: {
        ...currentData.income,
        husband: [...currentData.income.husband, newItem],
      },
    })
  }

  const addWifeIncomeItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setCurrentData({
      ...currentData,
      income: {
        ...currentData.income,
        wife: [...currentData.income.wife, newItem],
      },
    })
  }

  const calculateTotalSavings = () => {
    return currentData.savings.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTotalFixedExpenses = () => {
    return currentData.fixedExpenses.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTotalVariableExpenses = () => {
    return Object.values(currentData.variableExpenses)
      .flat()
      .reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTotalDebtPayments = () => {
    return currentData.debtPayments.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateActualSavings = () => {
    const totalIncome = calculateTotalIncome()
    const totalExpenses =
      calculateTotalFixedExpenses() + calculateTotalVariableExpenses() + calculateTotalDebtPayments()
    return totalIncome - totalExpenses
  }

  const calculateActualSavingsRate = () => {
    const totalIncome = calculateTotalIncome()
    const actualSavings = calculateActualSavings()
    return totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0
  }

  const calculateVariableExpenseRate = () => {
    const totalIncome = calculateTotalIncome()
    const totalVariableExpenses = calculateTotalVariableExpenses()
    return totalIncome > 0 ? (totalVariableExpenses / totalIncome) * 100 : 0
  }

  const calculateParkingAmount = () => {
    const totalIncome = calculateTotalIncome()
    const totalSavings = calculateTotalSavings()
    const totalDebtPayments = calculateTotalDebtPayments()
    const totalFixedExpenses = calculateTotalFixedExpenses()
    const totalVariableExpenses = calculateTotalVariableExpenses()
    
    return totalIncome - totalSavings - totalDebtPayments - totalFixedExpenses - totalVariableExpenses
  }

  // 저장 함수
  const saveMonthlyData = async () => {
    // 자산 업데이트 로직 (월별 독립적인 자산 사용)
    const updatedAssets = { ...monthlyAssets }

    // 저축 반영
    currentData.savings.forEach((savingItem) => {
      const cashIndex = updatedAssets.cash.findIndex((item) => item.name === savingItem.name)
      if (cashIndex >= 0) {
        updatedAssets.cash[cashIndex].amount += savingItem.amount
      } else if (savingItem.name) {
        updatedAssets.cash.push({
          id: Date.now().toString() + Math.random(),
          name: savingItem.name,
          amount: savingItem.amount,
        })
      }
    })

    // 파킹통장 계산 (총 수입 - 저축 - 부채상환 - 고정지출 - 변동지출)
    const totalIncome = calculateTotalIncome()
    const totalSavings = calculateTotalSavings()
    const totalDebtPayments = calculateTotalDebtPayments()
    const totalFixedExpenses = calculateTotalFixedExpenses()
    const totalVariableExpenses = calculateTotalVariableExpenses()
    
    const parkingAmount = totalIncome - totalSavings - totalDebtPayments - totalFixedExpenses - totalVariableExpenses
    
    // 파킹통장에 잔액 누적 반영 (양수인 경우만)
    if (parkingAmount > 0) {
      const parkingIndex = updatedAssets.cash.findIndex((item) => item.name === "파킹통장")
      if (parkingIndex >= 0) {
        // 기존 파킹통장에 누적해서 더하기
        updatedAssets.cash[parkingIndex].amount += parkingAmount
      } else {
        // 파킹통장이 없으면 새로 생성
        updatedAssets.cash.push({
          id: Date.now().toString() + Math.random(),
          name: "파킹통장",
          amount: parkingAmount,
        })
      }
    }

    // 주식 거래 반영
    currentData.stockTransactions.buy.forEach((buyItem) => {
      const stockIndex = updatedAssets.stocks.findIndex((item) => item.name === buyItem.name)
      if (stockIndex >= 0) {
        updatedAssets.stocks[stockIndex].quantity += buyItem.quantity
        // 평균 매입가 계산
        const totalValue =
          (updatedAssets.stocks[stockIndex].quantity - buyItem.quantity) *
            updatedAssets.stocks[stockIndex].purchasePrice +
          buyItem.quantity * buyItem.purchasePrice
        updatedAssets.stocks[stockIndex].purchasePrice = totalValue / updatedAssets.stocks[stockIndex].quantity
      } else if (buyItem.name) {
        updatedAssets.stocks.push({
          id: Date.now().toString() + Math.random(),
          name: buyItem.name,
          quantity: buyItem.quantity,
          purchasePrice: buyItem.purchasePrice,
        })
      }
    })

    currentData.stockTransactions.sell.forEach((sellItem) => {
      const stockIndex = updatedAssets.stocks.findIndex((item) => item.name === sellItem.name)
      if (stockIndex >= 0) {
        updatedAssets.stocks[stockIndex].quantity -= sellItem.quantity
        if (updatedAssets.stocks[stockIndex].quantity <= 0) {
          updatedAssets.stocks.splice(stockIndex, 1)
        }
      }
    })

    // 부채 상환 반영
    currentData.debtPayments.forEach((debtItem) => {
      const debtIndex = updatedAssets.debt.findIndex((item) => item.name === debtItem.name)
      if (debtIndex >= 0) {
        updatedAssets.debt[debtIndex].amount -= debtItem.amount
        if (updatedAssets.debt[debtIndex].amount <= 0) {
          updatedAssets.debt.splice(debtIndex, 1)
        }
      }
    })

    // 순자산 계산
    const cashTotal = updatedAssets.cash.reduce((sum, item) => sum + item.amount, 0)
    const stockTotal = updatedAssets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
    const realEstateTotal = updatedAssets.realEstate.reduce((sum, item) => sum + item.amount, 0)
    const debtTotal = updatedAssets.debt.reduce((sum, item) => sum + item.amount, 0)
    const netWorth = cashTotal + stockTotal + realEstateTotal - debtTotal

    const updatedCurrentData = {
      ...currentData,
      netWorth,
      assetSnapshots: updatedAssets, // 월별 자산 스냅샷 저장
    }

    // 데이터베이스에 저장
    const [year, month] = currentMonth.split('-').map(Number)
    const success = await saveMonthlyDataToDB(year, month, updatedCurrentData)
    
    if (success) {
      // 전역 누적 자산을 업데이트 (다른 월에서도 이 변경사항을 기반으로 시작)
      setAssets(updatedAssets)
      alert("저장되었습니다!")
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 space-y-8">
        {/* 월별 관리 헤더 */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">📅 월별 관리</h2>
        </div>

        {/* 현재 자산 현황 - 배경에만 색상, 내부 카드는 화이트 */}
        <div className="bg-gradient-to-r from-blue-200 via-green-200 to-pink-200 rounded-2xl p-1 mb-6">
          <div className="rounded-xl p-6 bg-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{currentMonth} 자산 현황</h3>
              <div className="text-2xl font-bold text-gray-800">
                순자산:{" "}
                {(() => {
                  const displayAssets = getDisplayAssets()
                  return (
                    displayAssets.cash.reduce((sum, item) => sum + item.amount, 0) +
                    displayAssets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0) +
                    displayAssets.realEstate.reduce((sum, item) => sum + item.amount, 0) -
                    displayAssets.debt.reduce((sum, item) => sum + item.amount, 0)
                  ).toLocaleString()
                })()}
                원
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-green-800 font-medium">현금성</div>
                <div className="text-xl font-bold text-green-900">
                  {getDisplayAssets().cash.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {getDisplayAssets().cash.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: {item.amount.toLocaleString()}원
                    </div>
                  ))}
                  {getDisplayAssets().cash.length > 3 && <div>외 {getDisplayAssets().cash.length - 3}개</div>}
                </div>
              </div>

              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-pink-800 font-medium">주식</div>
                <div className="text-xl font-bold text-pink-900">
                  {getDisplayAssets().stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0).toLocaleString()}
                  원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {getDisplayAssets().stocks.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: {item.quantity}주
                    </div>
                  ))}
                  {getDisplayAssets().stocks.length > 3 && <div>외 {getDisplayAssets().stocks.length - 3}개</div>}
                </div>
              </div>

              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-blue-800 font-medium">비가용 자산</div>
                <div className="text-xl font-bold text-blue-900">
                  {getDisplayAssets().realEstate.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {getDisplayAssets().realEstate.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: {item.amount.toLocaleString()}원
                    </div>
                  ))}
                  {getDisplayAssets().realEstate.length > 3 && <div>외 {getDisplayAssets().realEstate.length - 3}개</div>}
                </div>
              </div>

              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-red-800 font-medium">부채</div>
                <div className="text-xl font-bold text-red-900">
                  -{getDisplayAssets().debt.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {getDisplayAssets().debt.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: -{item.amount.toLocaleString()}원
                    </div>
                  ))}
                  {getDisplayAssets().debt.length > 3 && <div>외 {getDisplayAssets().debt.length - 3}개</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 월별 요약 - 테두리 없음 */}
        <div className="bg-gradient-to-r from-green-200 via-blue-200 to-pink-200 rounded-2xl p-1 leading-9 font-extralight text-white bg-white my-0 px-0 py-0">
          <div className="bg-white rounded-xl p-6 border-transparent">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{currentMonth} 월별 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-sky-50">
                <div className="text-sm text-green-800 font-medium">총 수입</div>
                <div className="text-2xl font-bold text-green-900">{calculateTotalIncome().toLocaleString()}원</div>
              </div>

              <div className="text-center p-4 rounded-xl bg-green-50">
                <div className="text-sm text-blue-800 font-medium">실제 저축</div>
                <div className="text-xl font-bold text-blue-900">{calculateActualSavings().toLocaleString()}원</div>
                <div className="text-xs text-blue-700">({calculateActualSavingsRate().toFixed(1)}%)</div>
              </div>

              <div className="text-center p-4 bg-pink-50 rounded-xl">
                <div className="text-sm text-pink-800 font-medium">변동지출</div>
                <div className="text-xl font-bold text-pink-900">
                  {calculateTotalVariableExpenses().toLocaleString()}원
                </div>
                <div className="text-xs text-pink-700">({calculateVariableExpenseRate().toFixed(1)}%)</div>
              </div>


            </div>
          </div>
        </div>

        {/* 수입 카드 - 하나의 카드 내에서 2열로 분할 */}
        <Card className="border bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-200 to-pink-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-black">💰 수입</CardTitle>
              <div className="text-2xl font-bold text-black">{calculateTotalIncome().toLocaleString()}원</div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 남편 수입 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-800">👨 남편 수입</h3>
                  <div className="text-xl font-bold text-blue-800">
                    {currentData.income.husband.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                  </div>
                </div>
                <div className="space-y-3">
                  {currentData.income.husband.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...currentData.income.husband]
                          updated[index] = { ...item, name: e.target.value }
                          setCurrentData({
                            ...currentData,
                            income: { ...currentData.income, husband: updated },
                          })
                        }}
                        placeholder="수입 항목명"
                        className="flex-1 border-2 border-blue-300 focus:border-blue-400"
                      />
                      <Input
                        value={item.amount ? formatNumber(item.amount) : ""}
                        onChange={(e) => {
                          const formattedValue = handleNumberInput(e.target.value)
                          const numericValue = parseNumber(formattedValue)
                          const updated = [...currentData.income.husband]
                          updated[index] = { ...item, amount: numericValue }
                          setCurrentData({
                            ...currentData,
                            income: { ...currentData.income, husband: updated },
                          })
                        }}
                        placeholder="0"
                        className="w-32 border-2 border-blue-300 focus:border-blue-400 text-right"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = currentData.income.husband.filter((_, i) => i !== index)
                          setCurrentData({
                            ...currentData,
                            income: { ...currentData.income, husband: updated },
                          })
                        }}
                        className="text-pink-500 hover:bg-pink-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addHusbandIncomeItem}
                  variant="outline"
                  className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  남편 수입 추가
                </Button>
              </div>

              {/* 아내 수입 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-pink-800">👩 아내 수입</h3>
                  <div className="text-xl font-bold text-pink-800">
                    {currentData.income.wife.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                  </div>
                </div>
                <div className="space-y-3">
                  {currentData.income.wife.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...currentData.income.wife]
                          updated[index] = { ...item, name: e.target.value }
                          setCurrentData({
                            ...currentData,
                            income: { ...currentData.income, wife: updated },
                          })
                        }}
                        placeholder="수입 항목명"
                        className="flex-1 border-2 border-pink-200 focus:border-pink-300"
                      />
                      <Input
                        value={item.amount ? formatNumber(item.amount) : ""}
                        onChange={(e) => {
                          const formattedValue = handleNumberInput(e.target.value)
                          const numericValue = parseNumber(formattedValue)
                          const updated = [...currentData.income.wife]
                          updated[index] = { ...item, amount: numericValue }
                          setCurrentData({
                            ...currentData,
                            income: { ...currentData.income, wife: updated },
                          })
                        }}
                        placeholder="0"
                        className="w-32 border-2 border-pink-300 focus:border-pink-400 text-right"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = currentData.income.wife.filter((_, i) => i !== index)
                          setCurrentData({
                            ...currentData,
                            income: { ...currentData.income, wife: updated },
                          })
                        }}
                        className="text-pink-500 hover:bg-pink-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addWifeIncomeItem}
                  variant="outline"
                  className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  아내 수입 추가
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 저축 & 부채 상환 카드 - 2열로 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 text-black">🏦 저축</CardTitle>
                <div className="text-2xl font-bold text-black">{calculateTotalSavings().toLocaleString()}원</div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {currentData.savings.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...currentData.savings]
                        updated[index] = { ...item, name: e.target.value }
                        setCurrentData({ ...currentData, savings: updated })
                      }}
                      placeholder="저축 항목명"
                      className="flex-1 border-2 border-green-200 focus:border-green-300"
                    />
                    <Input
                      value={item.amount ? formatNumber(item.amount) : ""}
                      onChange={(e) => {
                        const formattedValue = handleNumberInput(e.target.value)
                        const numericValue = parseNumber(formattedValue)
                        const updated = [...currentData.savings]
                        updated[index] = { ...item, amount: numericValue }
                        setCurrentData({ ...currentData, savings: updated })
                      }}
                      placeholder="0"
                      className="w-32 border-2 border-green-200 focus:border-green-300 text-right"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = currentData.savings.filter((_, i) => i !== index)
                        setCurrentData({ ...currentData, savings: updated })
                      }}
                      className="text-pink-500 hover:bg-pink-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={addSavingsItem}
                variant="outline"
                className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                저축 항목 추가
              </Button>
            </CardContent>
          </Card>

          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2 text-black">💳 부채 상환</CardTitle>
                <div className="text-2xl font-bold text-black">{calculateTotalDebtPayments().toLocaleString()}원</div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {currentData.debtPayments.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...currentData.debtPayments]
                        updated[index] = { ...item, name: e.target.value }
                        setCurrentData({ ...currentData, debtPayments: updated })
                      }}
                      placeholder="부채 항목명"
                      className="flex-1 border-2 border-green-200 focus:border-green-300"
                    />
                    <Input
                      value={item.amount ? formatNumber(item.amount) : ""}
                      onChange={(e) => {
                        const formattedValue = handleNumberInput(e.target.value)
                        const numericValue = parseNumber(formattedValue)
                        const updated = [...currentData.debtPayments]
                        updated[index] = { ...item, amount: numericValue }
                        setCurrentData({ ...currentData, debtPayments: updated })
                      }}
                      placeholder="상환 금액"
                      className="w-32 border-2 border-green-200 focus:border-green-300 text-right"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = currentData.debtPayments.filter((_, i) => i !== index)
                        setCurrentData({ ...currentData, debtPayments: updated })
                      }}
                      className="text-pink-500 hover:bg-pink-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={addDebtPaymentItem}
                variant="outline"
                className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                부채 상환 항목 추가
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 주식 거래 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
              <CardTitle className="text-xl flex items-center gap-2 text-black">📈 주식 매수</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {currentData.stockTransactions.buy.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...currentData.stockTransactions.buy]
                        updated[index] = { ...item, name: e.target.value }
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, buy: updated },
                        })
                      }}
                      placeholder="종목명"
                      className="flex-1 border-2 border-green-200 focus:border-green-300"
                    />
                    <Input
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "")
                        const updated = [...currentData.stockTransactions.buy]
                        updated[index] = { ...item, quantity: Number(value) || 0 }
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, buy: updated },
                        })
                      }}
                      placeholder="수량"
                      className="w-20 border-2 border-green-200 focus:border-green-300 text-right"
                    />
                    <Input
                      value={item.purchasePrice ? formatNumber(item.purchasePrice) : ""}
                      onChange={(e) => {
                        const formattedValue = handleNumberInput(e.target.value)
                        const numericValue = parseNumber(formattedValue)
                        const updated = [...currentData.stockTransactions.buy]
                        updated[index] = { ...item, purchasePrice: numericValue }
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, buy: updated },
                        })
                      }}
                      placeholder="매입 금액"
                      className="w-28 border-2 border-green-200 focus:border-green-300 text-right"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = currentData.stockTransactions.buy.filter((_, i) => i !== index)
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, buy: updated },
                        })
                      }}
                      className="text-pink-500 hover:bg-pink-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={addStockBuyItem}
                variant="outline"
                className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                매수 항목 추가
              </Button>
            </CardContent>
          </Card>

          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
              <CardTitle className="text-xl flex items-center gap-2 text-black">📉 주식 매도</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {currentData.stockTransactions.sell.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...currentData.stockTransactions.sell]
                        updated[index] = { ...item, name: e.target.value }
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, sell: updated },
                        })
                      }}
                      placeholder="종목명"
                      className="flex-1 border-2 border-green-200 focus:border-green-300"
                    />
                    <Input
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "")
                        const updated = [...currentData.stockTransactions.sell]
                        updated[index] = { ...item, quantity: Number(value) || 0 }
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, sell: updated },
                        })
                      }}
                      placeholder="수량"
                      className="w-20 border-2 border-green-200 focus:border-green-300 text-right"
                    />
                    <Input
                      value={item.purchasePrice ? formatNumber(item.purchasePrice) : ""}
                      onChange={(e) => {
                        const formattedValue = handleNumberInput(e.target.value)
                        const numericValue = parseNumber(formattedValue)
                        const updated = [...currentData.stockTransactions.sell]
                        updated[index] = { ...item, purchasePrice: numericValue }
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, sell: updated },
                        })
                      }}
                      placeholder="매도 금액"
                      className="w-28 border-2 border-green-200 focus:border-green-300 text-right"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = currentData.stockTransactions.sell.filter((_, i) => i !== index)
                        setCurrentData({
                          ...currentData,
                          stockTransactions: { ...currentData.stockTransactions, sell: updated },
                        })
                      }}
                      className="text-pink-500 hover:bg-pink-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={addStockSellItem}
                variant="outline"
                className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                매도 항목 추가
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 고정지출 카드 */}
        <Card className="border bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-black">🏠 고정지출</CardTitle>
              <div className="text-2xl font-bold text-black">{calculateTotalFixedExpenses().toLocaleString()}원</div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {currentData.fixedExpenses.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Input
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...currentData.fixedExpenses]
                      updated[index] = { ...item, name: e.target.value }
                      setCurrentData({ ...currentData, fixedExpenses: updated })
                    }}
                    placeholder="고정지출 항목명"
                    className="flex-1 border-2 border-orange-200 focus:border-orange-300"
                  />
                  <Input
                    value={item.amount ? formatNumber(item.amount) : ""}
                    onChange={(e) => {
                      const formattedValue = handleNumberInput(e.target.value)
                      const numericValue = parseNumber(formattedValue)
                      const updated = [...currentData.fixedExpenses]
                      updated[index] = { ...item, amount: numericValue }
                      setCurrentData({ ...currentData, fixedExpenses: updated })
                    }}
                    placeholder="0"
                    className="w-32 border-2 border-orange-200 focus:border-orange-300 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = currentData.fixedExpenses.filter((_, i) => i !== index)
                      setCurrentData({ ...currentData, fixedExpenses: updated })
                    }}
                    className="text-pink-500 hover:bg-pink-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              onClick={addFixedExpenseItem}
              variant="outline"
              className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              고정지출 항목 추가
            </Button>
          </CardContent>
        </Card>

        {/* 변동지출 카드 */}
        <Card className="border bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-black">🛒 변동지출</CardTitle>
              <div className="text-2xl font-bold text-black">{calculateTotalVariableExpenses().toLocaleString()}원</div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* 새 카테고리 추가 */}
            <div className="flex gap-2 mb-6 p-4 bg-orange-50 rounded-xl">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="새 대분류 추가 (예: 식비, 교통비)"
                className="flex-1 border-2 border-orange-200 focus:border-orange-300"
              />
              <Button
                onClick={addVariableExpenseCategory}
                variant="outline"
                className="bg-orange-100 border-2 border-orange-200 text-orange-700 hover:bg-orange-200"
              >
                추가
              </Button>
            </div>

            <div className="space-y-6">
              {variableExpenseCategories.map((category) => {
                const categoryTotal = (currentData.variableExpenses[category] || []).reduce(
                  (sum, item) => sum + item.amount,
                  0,
                )
                return (
                  <div key={category} className="border border-gray-200 rounded-xl p-4 bg-orange-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg text-orange-600">{category}</h4>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-orange-600">{categoryTotal.toLocaleString()}원</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteVariableExpenseCategory(category)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(currentData.variableExpenses[category] || []).map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const updated = { ...currentData.variableExpenses }
                              updated[category][index] = { ...item, name: e.target.value }
                              setCurrentData({ ...currentData, variableExpenses: updated })
                            }}
                            placeholder="지출 항목명"
                            className="flex-1 border-2 border-orange-200 focus:border-orange-300"
                          />
                          <Input
                            value={item.amount ? formatNumber(item.amount) : ""}
                            onChange={(e) => {
                              const formattedValue = handleNumberInput(e.target.value)
                              const numericValue = parseNumber(formattedValue)
                              const updated = { ...currentData.variableExpenses }
                              updated[category][index] = { ...item, amount: numericValue }
                              setCurrentData({ ...currentData, variableExpenses: updated })
                            }}
                            placeholder="0"
                            className="w-32 border-2 border-orange-200 focus:border-orange-300 text-right"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = { ...currentData.variableExpenses }
                              updated[category] = updated[category].filter((_, i) => i !== index)
                              setCurrentData({ ...currentData, variableExpenses: updated })
                            }}
                            className="text-pink-500 hover:bg-pink-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => addVariableExpenseItem(category)}
                      variant="outline"
                      className="w-full mt-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {category} 항목 추가
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 비가용 자산 카드 */}
        <Card className="border bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-black">🏢 비가용 자산</CardTitle>
              <div className="text-2xl font-bold text-black">
                {monthlyAssets.realEstate.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {monthlyAssets.realEstate.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Input
                    value={item.name}
                    onChange={(e) => {
                      const updatedAssets = {
                        ...monthlyAssets,
                        realEstate: monthlyAssets.realEstate.map((realEstateItem, i) =>
                          i === index ? { ...realEstateItem, name: e.target.value } : realEstateItem
                        ),
                      }
                      setMonthlyAssets(updatedAssets)
                    }}
                    placeholder="비가용 자산 항목명"
                    className="flex-1 border-2 border-blue-200 focus:border-blue-300"
                  />
                  <Input
                    value={item.amount ? formatNumber(item.amount) : ""}
                    onChange={(e) => {
                      const formattedValue = handleNumberInput(e.target.value)
                      const numericValue = parseNumber(formattedValue)
                      const updatedAssets = {
                        ...monthlyAssets,
                        realEstate: monthlyAssets.realEstate.map((realEstateItem, i) =>
                          i === index ? { ...realEstateItem, amount: numericValue } : realEstateItem
                        ),
                      }
                      setMonthlyAssets(updatedAssets)
                    }}
                    placeholder="금액"
                    className="w-40 border-2 border-blue-200 focus:border-blue-300"
                  />
                  <Button
                    onClick={() => {
                      const updatedAssets = {
                        ...monthlyAssets,
                        realEstate: monthlyAssets.realEstate.filter((_, i) => i !== index),
                      }
                      setMonthlyAssets(updatedAssets)
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:bg-blue-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                const newItem: AssetItem = {
                  id: Date.now().toString(),
                  name: "",
                  amount: 0,
                }
                setMonthlyAssets({
                  ...monthlyAssets,
                  realEstate: [...monthlyAssets.realEstate, newItem],
                })
              }}
              variant="outline"
              className="w-full mt-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              비가용 자산 항목 추가
            </Button>
          </CardContent>
        </Card>

        {/* 저장 버튼 - 별도 카드 없이 단순 버튼 */}
        <div className="text-center">
          <Button
            onClick={saveMonthlyData}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl py-4 px-8 text-lg font-semibold"
          >
            <Save className="h-5 w-5 mr-2" />
            저장하기
          </Button>
        </div>
      </div>
    </div>
  )
}
