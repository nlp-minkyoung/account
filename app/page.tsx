"use client"

import { useState } from "react"
import { BudgetProvider } from "@/contexts/budget-context"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { MonthlyManagement } from "@/components/monthly-management"
import { MonthSelector } from "@/components/month-selector"
import { YearSelector } from "@/components/year-selector"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "monthly">("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BudgetProvider>
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)} className="border-gray-300">
                  <Settings className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-800">우리집 가계부</h1>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-gray-600 font-medium">연도</Label>
                <YearSelector />
                
                <Label className="text-gray-600 font-medium">관리 월</Label>
                <MonthSelector />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto bg-white">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "dashboard" | "monthly")}
              className="h-full"
            >
              <div className="bg-white border-b px-6 py-2">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-blue-300 data-[state=active]:text-blue-800"
                  >
                    📊 대시보드
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    className="data-[state=active]:bg-pink-300 data-[state=active]:text-pink-800"
                  >
                    📅 월별 관리
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="mt-0 h-full">
                <Dashboard />
              </TabsContent>
              <TabsContent value="monthly" className="mt-0 h-full">
                <MonthlyManagement />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </BudgetProvider>
  )
}
