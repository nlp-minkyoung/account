import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    console.log(`[${new Date().toISOString()}] GET /api/monthly - year: ${year}, month: ${month}`)
    
    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 })
    }
    
    const client = await pool.connect()
    
    // 월별 기본 데이터 조회
    const monthlyResult = await client.query(
      'SELECT * FROM monthly_data WHERE year = $1 AND month = $2',
      [parseInt(year), parseInt(month)]
    )
    
    let monthlyDataId = null
    
    if (monthlyResult.rows.length === 0) {
      // 월별 데이터가 없으면 생성
      const createResult = await client.query(
        'INSERT INTO monthly_data (year, month) VALUES ($1, $2) RETURNING id',
        [parseInt(year), parseInt(month)]
      )
      monthlyDataId = createResult.rows[0].id
    } else {
      monthlyDataId = monthlyResult.rows[0].id
    }
    
    // 관련 데이터 조회
    const [incomeResult, savingsResult, fixedExpensesResult, variableExpensesResult, stockTransactionsResult, debtPaymentsResult, assetSnapshotsResult] = await Promise.all([
      client.query('SELECT * FROM income WHERE monthly_data_id = $1', [monthlyDataId]),
      client.query('SELECT * FROM savings WHERE monthly_data_id = $1', [monthlyDataId]),
      client.query('SELECT * FROM fixed_expenses WHERE monthly_data_id = $1', [monthlyDataId]),
      client.query('SELECT * FROM variable_expenses WHERE monthly_data_id = $1', [monthlyDataId]),
      client.query('SELECT * FROM stock_transactions WHERE monthly_data_id = $1', [monthlyDataId]),
      client.query('SELECT * FROM debt_payments WHERE monthly_data_id = $1', [monthlyDataId]),
      client.query('SELECT * FROM monthly_asset_snapshots WHERE monthly_data_id = $1', [monthlyDataId])
    ])
    
    client.release()
    
    // 변동지출을 카테고리별로 그룹화
    const variableExpenses: { [key: string]: any[] } = {}
    variableExpensesResult.rows.forEach(row => {
      if (!variableExpenses[row.category_name]) {
        variableExpenses[row.category_name] = []
      }
      variableExpenses[row.category_name].push({
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount)
      })
    })
    
    // 자산 스냅샷을 타입별로 그룹화
    const assetSnapshots = {
      cash: [],
      stocks: [],
      realEstate: [],
      debt: []
    }
    
    assetSnapshotsResult.rows.forEach(row => {
      const asset = {
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount),
        ...(row.type === 'stock' && {
          quantity: row.quantity,
          purchasePrice: parseFloat(row.purchase_price)
        })
      }
      
      if (row.type === 'cash') {
        assetSnapshots.cash.push(asset)
      } else if (row.type === 'stock') {
        assetSnapshots.stocks.push(asset)
      } else if (row.type === 'real_estate') {
        assetSnapshots.realEstate.push(asset)
      } else if (row.type === 'debt') {
        assetSnapshots.debt.push(asset)
      }
    })
    
    return NextResponse.json({
      year: parseInt(year),
      month: parseInt(month),
      income: {
        husband: incomeResult.rows.filter(row => row.person === 'husband').map(row => ({
          id: row.id.toString(),
          name: row.name,
          amount: parseFloat(row.amount)
        })),
        wife: incomeResult.rows.filter(row => row.person === 'wife').map(row => ({
          id: row.id.toString(),
          name: row.name,
          amount: parseFloat(row.amount)
        }))
      },
      savings: savingsResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount)
      })),
      fixedExpenses: fixedExpensesResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount)
      })),
      variableExpenses,
      stockTransactions: {
        buy: stockTransactionsResult.rows.filter(row => row.transaction_type === 'buy').map(row => ({
          id: row.id.toString(),
          name: row.stock_name,
          quantity: row.quantity,
          purchasePrice: parseFloat(row.price)
        })),
        sell: stockTransactionsResult.rows.filter(row => row.transaction_type === 'sell').map(row => ({
          id: row.id.toString(),
          name: row.stock_name,
          quantity: row.quantity,
          purchasePrice: parseFloat(row.price)
        }))
      },
      debtPayments: debtPaymentsResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.debt_name,
        amount: parseFloat(row.payment_amount)
      })),
      netWorth: monthlyResult.rows[0]?.net_worth ? parseFloat(monthlyResult.rows[0].net_worth) : 0,
      assetSnapshots: assetSnapshots
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch monthly data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, monthlyData, currentAssets } = body
    
    console.log('[API] Received POST request:', { year, month, hasMonthlyData: !!monthlyData, hasCurrentAssets: !!currentAssets })
    
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // 월별 데이터 생성 또는 업데이트
      let monthlyDataId: number
      
      const existingResult = await client.query(
        'SELECT id FROM monthly_data WHERE year = $1 AND month = $2',
        [year, month]
      )
      
      if (existingResult.rows.length > 0) {
        monthlyDataId = existingResult.rows[0].id
        
        // 기존 데이터 삭제
        await Promise.all([
          client.query('DELETE FROM income WHERE monthly_data_id = $1', [monthlyDataId]),
          client.query('DELETE FROM savings WHERE monthly_data_id = $1', [monthlyDataId]),
          client.query('DELETE FROM fixed_expenses WHERE monthly_data_id = $1', [monthlyDataId]),
          client.query('DELETE FROM variable_expenses WHERE monthly_data_id = $1', [monthlyDataId]),
          client.query('DELETE FROM stock_transactions WHERE monthly_data_id = $1', [monthlyDataId]),
          client.query('DELETE FROM debt_payments WHERE monthly_data_id = $1', [monthlyDataId]),
          client.query('DELETE FROM monthly_asset_snapshots WHERE monthly_data_id = $1', [monthlyDataId])
        ])
      } else {
        const result = await client.query(
          'INSERT INTO monthly_data (year, month, net_worth) VALUES ($1, $2, $3) RETURNING id',
          [year, month, monthlyData.netWorth || 0]
        )
        monthlyDataId = result.rows[0].id
      }
      
      // 수입 데이터 저장
      if (monthlyData.income?.husband) {
        for (const item of monthlyData.income.husband) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO income (monthly_data_id, person, name, amount) VALUES ($1, $2, $3, $4)',
              [monthlyDataId, 'husband', item.name, item.amount]
            )
          }
        }
      }
      
      if (monthlyData.income?.wife) {
        for (const item of monthlyData.income.wife) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO income (monthly_data_id, person, name, amount) VALUES ($1, $2, $3, $4)',
              [monthlyDataId, 'wife', item.name, item.amount]
            )
          }
        }
      }
      
      // 저축 데이터 저장
      if (monthlyData.savings) {
        for (const item of monthlyData.savings) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO savings (monthly_data_id, name, amount) VALUES ($1, $2, $3)',
              [monthlyDataId, item.name, item.amount]
            )
          }
        }
      }
      
      // 고정지출 데이터 저장
      if (monthlyData.fixedExpenses) {
        for (const item of monthlyData.fixedExpenses) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO fixed_expenses (monthly_data_id, name, amount) VALUES ($1, $2, $3)',
              [monthlyDataId, item.name, item.amount]
            )
          }
        }
      }
      
      // 변동지출 데이터 저장
      if (monthlyData.variableExpenses) {
        for (const [categoryName, items] of Object.entries(monthlyData.variableExpenses)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.name && item.amount) {
                await client.query(
                  'INSERT INTO variable_expenses (monthly_data_id, category_name, name, amount) VALUES ($1, $2, $3, $4)',
                  [monthlyDataId, categoryName, item.name, item.amount]
                )
              }
            }
          }
        }
      }
      
      // 주식 거래 데이터 저장
      if (monthlyData.stockTransactions?.buy) {
        for (const item of monthlyData.stockTransactions.buy) {
          if (item.name && item.quantity && item.purchasePrice) {
            await client.query(
              'INSERT INTO stock_transactions (monthly_data_id, stock_name, transaction_type, quantity, price) VALUES ($1, $2, $3, $4, $5)',
              [monthlyDataId, item.name, 'buy', item.quantity, item.purchasePrice]
            )
          }
        }
      }
      
      if (monthlyData.stockTransactions?.sell) {
        for (const item of monthlyData.stockTransactions.sell) {
          if (item.name && item.quantity && item.purchasePrice) {
            await client.query(
              'INSERT INTO stock_transactions (monthly_data_id, stock_name, transaction_type, quantity, price) VALUES ($1, $2, $3, $4, $5)',
              [monthlyDataId, item.name, 'sell', item.quantity, item.purchasePrice]
            )
          }
        }
      }
      
      // 부채 상환 데이터 저장
      if (monthlyData.debtPayments) {
        for (const item of monthlyData.debtPayments) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO debt_payments (monthly_data_id, debt_name, payment_amount) VALUES ($1, $2, $3)',
              [monthlyDataId, item.name, item.amount]
            )
          }
        }
      }
      
      // 자산 스냅샷 저장
      if (currentAssets) {
        // 현금성 자산
        if (currentAssets.cash) {
          for (const item of currentAssets.cash) {
            if (item.name && item.amount) {
              await client.query(
                'INSERT INTO monthly_asset_snapshots (monthly_data_id, name, type, amount) VALUES ($1, $2, $3, $4)',
                [monthlyDataId, item.name, 'cash', item.amount]
              )
            }
          }
        }
        
        // 주식
        if (currentAssets.stocks) {
          for (const item of currentAssets.stocks) {
            if (item.name && item.quantity && item.purchasePrice) {
              await client.query(
                'INSERT INTO monthly_asset_snapshots (monthly_data_id, name, type, amount, quantity, purchase_price) VALUES ($1, $2, $3, $4, $5, $6)',
                [monthlyDataId, item.name, 'stock', item.quantity * item.purchasePrice, item.quantity, item.purchasePrice]
              )
            }
          }
        }
        
        // 비가용 자산(부동산)
        if (currentAssets.realEstate) {
          for (const item of currentAssets.realEstate) {
            if (item.name && item.amount) {
              await client.query(
                'INSERT INTO monthly_asset_snapshots (monthly_data_id, name, type, amount) VALUES ($1, $2, $3, $4)',
                [monthlyDataId, item.name, 'real_estate', item.amount]
              )
            }
          }
        }
        
        // 부채
        if (currentAssets.debt) {
          for (const item of currentAssets.debt) {
            if (item.name && item.amount) {
              await client.query(
                'INSERT INTO monthly_asset_snapshots (monthly_data_id, name, type, amount) VALUES ($1, $2, $3, $4)',
                [monthlyDataId, item.name, 'debt', item.amount]
              )
            }
          }
        }
      }
      
      // 순자산 업데이트
      await client.query(
        'UPDATE monthly_data SET net_worth = $1, updated_at = NOW() WHERE id = $2',
        [monthlyData.netWorth || 0, monthlyDataId]
      )
      
      await client.query('COMMIT')
      
      console.log('[API] Successfully saved monthly data with ID:', monthlyDataId)
      return NextResponse.json({ success: true, monthlyDataId })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('[API] Transaction error:', error)
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[API] Database error:', error)
    return NextResponse.json({ error: 'Failed to save monthly data', details: error.message }, { status: 500 })
  }
}