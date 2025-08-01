"use client"

import { useEffect } from "react"
import { useBudget } from "@/contexts/budget-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Line, 
  LineChart, 
  Bar,
  BarChart,
  ComposedChart,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LabelList,
  Cell
} from "recharts"

export function Dashboard() {
  const { assets, monthlyData, currentYear, loadMonthlyData } = useBudget()

  // 대시보드가 마운트될 때 해당 연도의 모든 월별 데이터 로드
  useEffect(() => {
    const loadYearlyData = async () => {
      for (let month = 1; month <= 12; month++) {
        await loadMonthlyData(currentYear, month)
      }
    }
    loadYearlyData()
  }, [currentYear, loadMonthlyData])

  // 순자산 계산
  const calculateNetWorth = () => {
    const cashTotal = assets.cash.reduce((sum, item) => sum + item.amount, 0)
    const stockTotal = assets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
    const realEstateTotal = assets.realEstate.reduce((sum, item) => sum + item.amount, 0)
    const debtTotal = assets.debt.reduce((sum, item) => sum + item.amount, 0)

    return cashTotal + stockTotal + realEstateTotal - debtTotal
  }

  // 유동자산 계산
  const calculateLiquidAssets = () => {
    const cashTotal = assets.cash.reduce((sum, item) => sum + item.amount, 0)
    const stockTotal = assets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
    return cashTotal + stockTotal
  }

  // 실제 월별 데이터가 있는지 확인하는 함수
  const hasRealMonthlyData = (data: any) => {
    if (!data) return false
    
    // 수입, 저축, 지출, 주식거래, 부채상환, 자산스냅샷 중 하나라도 실제 데이터가 있으면 true
    const hasIncome = data.income && (
      (data.income.husband && data.income.husband.length > 0 && data.income.husband.some((item: any) => item.amount > 0)) ||
      (data.income.wife && data.income.wife.length > 0 && data.income.wife.some((item: any) => item.amount > 0))
    )
    
    const hasSavings = data.savings && data.savings.length > 0 && data.savings.some((item: any) => item.amount > 0)
    
    const hasFixedExpenses = data.fixedExpenses && data.fixedExpenses.length > 0 && data.fixedExpenses.some((item: any) => item.amount > 0)
    
    const hasVariableExpenses = data.variableExpenses && 
      Object.values(data.variableExpenses).some((expenses: any) => 
        expenses && expenses.length > 0 && expenses.some((item: any) => item.amount > 0)
      )
    
    const hasStockTransactions = data.stockTransactions && (
      (data.stockTransactions.buy && data.stockTransactions.buy.length > 0) ||
      (data.stockTransactions.sell && data.stockTransactions.sell.length > 0)
    )
    
    const hasDebtPayments = data.debtPayments && data.debtPayments.length > 0 && data.debtPayments.some((item: any) => item.amount > 0)
    
    // 자산 스냅샷이 있는 경우도 실제 데이터로 간주 (월별 관리에서 저장 버튼을 눌렀다는 의미)
    const hasAssetSnapshots = data.assetSnapshots && (
      (data.assetSnapshots.cash && data.assetSnapshots.cash.length > 0) ||
      (data.assetSnapshots.stocks && data.assetSnapshots.stocks.length > 0) ||
      (data.assetSnapshots.realEstate && data.assetSnapshots.realEstate.length > 0) ||
      (data.assetSnapshots.debt && data.assetSnapshots.debt.length > 0)
    )
    
    return hasIncome || hasSavings || hasFixedExpenses || hasVariableExpenses || hasStockTransactions || hasDebtPayments || hasAssetSnapshots
  }

  // 월별 데이터 생성 (1월부터 12월까지 모든 월 포함, 데이터 없는 월은 null 값)
  const generateMonthlyChartData = () => {
    const allMonths = []
    
    // 1월부터 12월까지 모든 월 생성
    for (let month = 1; month <= 12; month++) {
      const key = `${currentYear}-${String(month).padStart(2, "0")}`
      const data = monthlyData[key]
      
      
      if (data && hasRealMonthlyData(data)) {
        // 데이터가 있는 월
        const displayAssets = data.assetSnapshots || assets
        const cashAssets = displayAssets.cash.reduce((sum, item) => sum + item.amount, 0)
        const stockAssets = displayAssets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
        const totalSavings = data.savings?.reduce((sum, item) => sum + item.amount, 0) || 0
        const totalVariableExpenses = data.variableExpenses ? 
          Object.values(data.variableExpenses).flat().reduce((sum, item) => sum + item.amount, 0) : 0
        
        // 총 수입 계산
        const totalIncome = (data.income?.husband?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                           (data.income?.wife?.reduce((sum, item) => sum + item.amount, 0) || 0)
        
        // 저축율과 변동지출비율 계산
        const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
        const variableExpenseRate = totalIncome > 0 ? (totalVariableExpenses / totalIncome) * 100 : 0
        
        allMonths.push({
          month: key,
          shortMonth: `${month}월`,
          netWorth: data.netWorth,
          netWorthInEok: data.netWorth / 100000000,
          liquidAssets: cashAssets + stockAssets,
          cashAssets,
          stockAssets,
          totalSavings,
          totalVariableExpenses,
          savingsRate,
          variableExpenseRate
        })
      } else {
        // 데이터가 없는 월 (null 값으로 설정하여 그래프에서 빈 공간으로 표시)
        allMonths.push({
          month: key,
          shortMonth: `${month}월`,
          netWorth: null,
          netWorthInEok: null,
          liquidAssets: null,
          cashAssets: null,
          stockAssets: null,
          totalSavings: null,
          totalVariableExpenses: null,
          savingsRate: null,
          variableExpenseRate: null
        })
      }
    }
    
    return allMonths
  }
  
  const monthlyChartData = generateMonthlyChartData()

  // 연간 총 수입 계산
  const calculateYearlyTotalIncome = () => {
    let totalIncome = 0
    for (let month = 1; month <= 12; month++) {
      const key = `${currentYear}-${String(month).padStart(2, "0")}`
      const data = monthlyData[key]
      if (data && hasRealMonthlyData(data) && data.income) {
        const monthlyIncome = (data.income.husband?.reduce((sum, item) => sum + item.amount, 0) || 0) +
                             (data.income.wife?.reduce((sum, item) => sum + item.amount, 0) || 0)
        totalIncome += monthlyIncome
      }
    }
    return totalIncome
  }

  // 연간 총 저축 계산
  const calculateYearlyTotalSavings = () => {
    let totalSavings = 0
    for (let month = 1; month <= 12; month++) {
      const key = `${currentYear}-${String(month).padStart(2, "0")}`
      const data = monthlyData[key]
      if (data && hasRealMonthlyData(data) && data.savings) {
        const monthlySavings = data.savings.reduce((sum, item) => sum + item.amount, 0)
        totalSavings += monthlySavings
      }
    }
    return totalSavings
  }

  // 연간 저축율 계산
  const calculateYearlySavingsRate = () => {
    const yearlyIncome = calculateYearlyTotalIncome()
    const yearlySavings = calculateYearlyTotalSavings()
    return yearlyIncome > 0 ? (yearlySavings / yearlyIncome) * 100 : 0
  }

  // 연간 주식 수익률 계산 (초기 자산 대비 현재 자산 변화)
  const calculateYearlyStockReturn = () => {
    // 연초 주식 자산값 (1월 실제 데이터의 스냅샷 또는 초기 자산)
    const janKey = `${currentYear}-01`
    const janData = monthlyData[janKey]
    const initialStockValue = (janData && hasRealMonthlyData(janData) && janData.assetSnapshots?.stocks) ?
                             janData.assetSnapshots.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0) : 
                             assets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)

    // 현재 주식 자산값 (가장 최근 실제 데이터의 스냅샷 또는 현재 자산)
    let currentStockValue = assets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
    
    // 가장 최근 실제 데이터에서 스냅샷 찾기
    for (let month = 12; month >= 1; month--) {
      const key = `${currentYear}-${String(month).padStart(2, "0")}`
      const data = monthlyData[key]
      if (data && hasRealMonthlyData(data) && data.assetSnapshots?.stocks) {
        currentStockValue = data.assetSnapshots.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
        break
      }
    }

    return initialStockValue > 0 ? ((currentStockValue - initialStockValue) / initialStockValue) * 100 : 0
  }

  const yearlyTotalIncome = calculateYearlyTotalIncome()
  const yearlyTotalSavings = calculateYearlyTotalSavings()
  const yearlySavingsRate = calculateYearlySavingsRate()
  const yearlyStockReturn = calculateYearlyStockReturn()

  // 현재 자산 현황을 위한 최신 자산 데이터 가져오기
  const getCurrentAssets = () => {
    // 가장 최근 월 데이터에서 자산 스냅샷 찾기
    for (let month = 12; month >= 1; month--) {
      const key = `${currentYear}-${String(month).padStart(2, "0")}`
      const data = monthlyData[key]
      if (data && hasRealMonthlyData(data) && data.assetSnapshots) {
        return data.assetSnapshots
      }
    }
    // 스냅샷이 없으면 전역 자산 사용
    return assets
  }

  const currentAssets = getCurrentAssets()
  const netWorth = calculateNetWorth()
  const liquidAssets = calculateLiquidAssets()

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 space-y-8">
        {/* 연간 통계 헤더 */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">📊 {currentYear}년 연간 통계</h2>
        </div>

        {/* 현재 자산 현황 - 배경에만 색상, 내부 카드는 화이트 */}
        <div className="bg-gradient-to-r from-blue-200 via-green-200 to-pink-200 rounded-2xl p-1 mb-6">
          <div className="rounded-xl p-6 bg-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">현재 자산 현황</h3>
              <div className="text-2xl font-bold text-gray-800">순자산: {netWorth.toLocaleString()}원</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-green-800 font-medium">현금성</div>
                <div className="text-xl font-bold text-green-900">
                  {currentAssets.cash.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {currentAssets.cash.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: {item.amount.toLocaleString()}원
                    </div>
                  ))}
                  {currentAssets.cash.length > 3 && <div>외 {currentAssets.cash.length - 3}개</div>}
                </div>
              </div>

              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-pink-800 font-medium">주식</div>
                <div className="text-xl font-bold text-pink-900">
                  {currentAssets.stocks.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {currentAssets.stocks.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: {item.quantity}주
                    </div>
                  ))}
                  {currentAssets.stocks.length > 3 && <div>외 {currentAssets.stocks.length - 3}개</div>}
                </div>
              </div>

              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-blue-800 font-medium">비가용 자산</div>
                <div className="text-xl font-bold text-blue-900">
                  {currentAssets.realEstate.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {currentAssets.realEstate.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: {item.amount.toLocaleString()}원
                    </div>
                  ))}
                  {currentAssets.realEstate.length > 3 && <div>외 {currentAssets.realEstate.length - 3}개</div>}
                </div>
              </div>

              <div className="text-center p-4 bg-white border rounded-xl">
                <div className="text-sm text-red-800 font-medium">부채</div>
                <div className="text-xl font-bold text-red-900">
                  -{currentAssets.debt.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {currentAssets.debt.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      {item.name}: -{item.amount.toLocaleString()}원
                    </div>
                  ))}
                  {currentAssets.debt.length > 3 && <div>외 {currentAssets.debt.length - 3}개</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 주요 지표 - 하나의 카드로 통합 */}
        <Card className="border-0 bg-gradient-to-r from-green-200 via-blue-200 to-pink-200 rounded-2xl overflow-hidden p-1">
          <div className="bg-white rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-800 mb-2 flex items-center justify-center gap-2">
                  💰 총 수입
                </div>
                <div className="text-3xl font-bold text-green-700">{yearlyTotalIncome.toLocaleString()}원</div>
                <div className="text-sm text-gray-500 mt-1">{currentYear}년 총 수입</div>
              </div>

              <div className="text-center border-l border-r border-gray-200">
                <div className="text-lg font-semibold text-blue-800 mb-2 flex items-center justify-center gap-2">
                  📊 저축율
                </div>
                <div className="text-3xl font-bold text-blue-700">{yearlySavingsRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-500 mt-1">{currentYear}년 평균 저축율</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-pink-800 mb-2 flex items-center justify-center gap-2">
                  📈 주식 수익율
                </div>
                <div className="text-3xl font-bold text-pink-700">
                  {yearlyStockReturn >= 0 ? '+' : ''}{yearlyStockReturn.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">{currentYear}년 주식 수익률</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300">
              <CardTitle className="text-xl flex items-center gap-2 text-black">월별 순자산</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="shortMonth" stroke="#666" />
                    <YAxis 
                      stroke="#666" 
                      domain={[0, 'dataMax + 0.5']}
                      tickFormatter={(value) => `${value.toFixed(1)}억`}
                      interval={0}
                      ticks={[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]}
                    />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(1)}억`, "순자산"]}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="netWorthInEok"
                      stroke="#93c5fd"
                      strokeWidth={3}
                      dot={{ fill: "#93c5fd", strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: "#93c5fd", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-200 to-green-300">
              <CardTitle className="text-xl flex items-center gap-2 text-black">월별 유동자산</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="shortMonth" stroke="#666" />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()}원`, 
                        name === 'cashAssets' ? '현금성' : '주식'
                      ]}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="cashAssets" stackId="liquid" fill="#86efac" name="현금성" />
                    <Bar dataKey="stockAssets" stackId="liquid" fill="#f59e0b" name="주식">
                      <LabelList 
                        dataKey="liquidAssets" 
                        position="top" 
                        formatter={(value) => Number(value) > 0 ? `${Number(value).toLocaleString()}` : ''}
                        style={{ fontSize: '12px', fill: '#374151' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추가 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-300">
              <CardTitle className="text-xl flex items-center gap-2 text-black">월별 순저축</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="shortMonth" stroke="#666" />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name == '저축율') {
                          return [`${Number(value).toFixed(1)}%`, "저축율"]
                        }
                        return [`${Number(value).toLocaleString()}원`, "순저축"]
                      }}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar yAxisId="left" dataKey="totalSavings" fill="#8b5cf6" name="순저축">
                      <LabelList 
                        dataKey="totalSavings" 
                        position="top" 
                        formatter={(value) => Number(value) > 0 ? `${Number(value).toLocaleString()}` : ''}
                        style={{ fontSize: '12px', fill: '#374151' }}
                      />
                    </Bar>
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="savingsRate" 
                      stroke="#c4b5fd" 
                      strokeWidth={3}
                      dot={{ fill: "#c4b5fd", strokeWidth: 2, r: 4 }}
                      name="저축율"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-200 to-orange-300">
              <CardTitle className="text-xl flex items-center gap-2 text-black">🛒 월별 변동지출</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="shortMonth" stroke="#666" />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name == '변동지출비율') {
                          return [`${Number(value).toFixed(1)}%`, "변동지출비율"]
                        }
                        return [`${Number(value).toLocaleString()}원`, "변동지출"]
                      }}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar yAxisId="left" dataKey="totalVariableExpenses" fill="#f97316" name="변동지출">
                      <LabelList 
                        dataKey="totalVariableExpenses" 
                        position="top" 
                        formatter={(value) => Number(value) > 0 ? `${Number(value).toLocaleString()}` : ''}
                        style={{ fontSize: '12px', fill: '#374151' }}
                      />
                    </Bar>
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="variableExpenseRate" 
                      stroke="#fdba74" 
                      strokeWidth={3}
                      dot={{ fill: "#fdba74", strokeWidth: 2, r: 4 }}
                      name="변동지출비율"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
