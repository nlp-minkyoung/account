"use client"
import { useBudget, type AssetItem, type StockItem, type Assets } from "@/contexts/budget-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Trash2, Save } from "lucide-react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [initialAssets, setInitialAssets] = useState<Assets>({
    cash: [],
    stocks: [],
    realEstate: [],
    debt: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialAssetsSaved, setIsInitialAssetsSaved] = useState(false)

  // 초기 자산 로드
  useEffect(() => {
    const loadInitialAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (response.ok) {
          const data = await response.json()
          setIsInitialAssetsSaved(data.isSaved)
          // isSaved를 제외하고 자산 데이터만 설정
          const { isSaved, ...assetData } = data
          setInitialAssets(assetData)
        }
      } catch (error) {
        console.error('Error loading initial assets:', error)
      }
    }
    
    if (isOpen) {
      loadInitialAssets()
    }
  }, [isOpen])

  const saveAssets = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialAssets),
      })

      if (response.ok) {
        setIsInitialAssetsSaved(true)
        alert('초기 자산이 성공적으로 저장되었습니다!')
      } else {
        alert('자산 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error saving assets:', error)
      alert('자산 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const addCashItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setInitialAssets({
      ...initialAssets,
      cash: [...initialAssets.cash, newItem],
    })
  }

  const addStockItem = () => {
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 0,
      purchasePrice: 0,
    }
    setInitialAssets({
      ...initialAssets,
      stocks: [...initialAssets.stocks, newItem],
    })
  }

  const addRealEstateItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setInitialAssets({
      ...initialAssets,
      realEstate: [...initialAssets.realEstate, newItem],
    })
  }

  const addDebtItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    }
    setInitialAssets({
      ...initialAssets,
      debt: [...initialAssets.debt, newItem],
    })
  }

  const updateCashItem = (id: string, field: keyof AssetItem, value: string | number) => {
    setInitialAssets({
      ...initialAssets,
      cash: initialAssets.cash.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    })
  }

  const updateStockItem = (id: string, field: keyof StockItem, value: string | number) => {
    setInitialAssets({
      ...initialAssets,
      stocks: initialAssets.stocks.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    })
  }

  const updateRealEstateItem = (id: string, field: keyof AssetItem, value: string | number) => {
    setInitialAssets({
      ...initialAssets,
      realEstate: initialAssets.realEstate.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    })
  }

  const updateDebtItem = (id: string, field: keyof AssetItem, value: string | number) => {
    setInitialAssets({
      ...initialAssets,
      debt: initialAssets.debt.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    })
  }

  const deleteCashItem = (id: string) => {
    setInitialAssets({
      ...initialAssets,
      cash: initialAssets.cash.filter((item) => item.id !== id),
    })
  }

  const deleteStockItem = (id: string) => {
    setInitialAssets({
      ...initialAssets,
      stocks: initialAssets.stocks.filter((item) => item.id !== id),
    })
  }

  const deleteRealEstateItem = (id: string) => {
    setInitialAssets({
      ...initialAssets,
      realEstate: initialAssets.realEstate.filter((item) => item.id !== id),
    })
  }

  const deleteDebtItem = (id: string) => {
    setInitialAssets({
      ...initialAssets,
      debt: initialAssets.debt.filter((item) => item.id !== id),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-96 bg-white shadow-lg border-r overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">초기 자산 설정</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <Tabs defaultValue="cash" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash">현금성</TabsTrigger>
              <TabsTrigger value="stocks">주식</TabsTrigger>
              <TabsTrigger value="debt">부채</TabsTrigger>
            </TabsList>

            <TabsContent value="cash" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">현금성 자산</h3>
                <Button size="sm" onClick={addCashItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  추가
                </Button>
              </div>

              {initialAssets.cash.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>항목명</Label>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCashItem(item.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Input
                      value={item.name}
                      onChange={(e) => updateCashItem(item.id, "name", e.target.value)}
                      placeholder="예: 예금, 적금"
                    />
                    <div>
                      <Label>금액</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateCashItem(item.id, "amount", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="stocks" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">주식</h3>
                <Button size="sm" onClick={addStockItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  추가
                </Button>
              </div>

              {initialAssets.stocks.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>종목명</Label>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteStockItem(item.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Input
                      value={item.name}
                      onChange={(e) => updateStockItem(item.id, "name", e.target.value)}
                      placeholder="예: 삼성전자"
                    />
                    <div>
                      <Label>수량</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateStockItem(item.id, "quantity", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>매입금액</Label>
                      <Input
                        type="number"
                        value={item.purchasePrice}
                        onChange={(e) => updateStockItem(item.id, "purchasePrice", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>


            <TabsContent value="debt" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">부채</h3>
                <Button size="sm" onClick={addDebtItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  추가
                </Button>
              </div>

              {initialAssets.debt.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>항목명</Label>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDebtItem(item.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Input
                      value={item.name}
                      onChange={(e) => updateDebtItem(item.id, "name", e.target.value)}
                      placeholder="예: 주택대출, 신용대출"
                    />
                    <div>
                      <Label>금액</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateDebtItem(item.id, "amount", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
          
          {/* 저장 버튼 */}
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={saveAssets}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl py-3 text-base font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '저장 중...' : '자산 저장하기'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
    </div>
  )
}
