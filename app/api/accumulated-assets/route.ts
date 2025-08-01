import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function GET() {
  try {
    const client = await pool.connect()
    
    const cashResult = await client.query(
      'SELECT * FROM accumulated_assets WHERE type = $1 ORDER BY created_at',
      ['cash']
    )
    
    const stocksResult = await client.query(
      'SELECT * FROM accumulated_assets WHERE type = $1 ORDER BY created_at',
      ['stock']
    )
    
    const realEstateResult = await client.query(
      'SELECT * FROM accumulated_assets WHERE type = $1 ORDER BY created_at',
      ['real_estate']
    )
    
    const debtResult = await client.query(
      'SELECT * FROM accumulated_assets WHERE type = $1 ORDER BY created_at',
      ['debt']
    )
    
    client.release()
    
    return NextResponse.json({
      cash: cashResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount)
      })),
      stocks: stocksResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        quantity: row.quantity || 0,
        purchasePrice: parseFloat(row.purchase_price || '0'),
        currentPrice: parseFloat(row.current_price || '0')
      })),
      realEstate: realEstateResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount)
      })),
      debt: debtResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        amount: parseFloat(row.amount)
      }))
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch accumulated assets' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { cash, stocks, realEstate, debt } = body
    
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // 누적 자산 업데이트
      await client.query('DELETE FROM accumulated_assets')
      
      // 현금성 자산 저장
      if (cash && cash.length > 0) {
        for (const item of cash) {
          if (item.name) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'cash', item.amount || 0]
            )
          }
        }
      }
      
      // 주식 저장
      if (stocks && stocks.length > 0) {
        for (const item of stocks) {
          if (item.name) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount, quantity, purchase_price) VALUES ($1, $2, $3, $4, $5)',
              [item.name, 'stock', (item.quantity || 0) * (item.purchasePrice || 0), item.quantity || 0, item.purchasePrice || 0]
            )
          }
        }
      }
      
      // 부동산 저장
      if (realEstate && realEstate.length > 0) {
        for (const item of realEstate) {
          if (item.name) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'real_estate', item.amount || 0]
            )
          }
        }
      }
      
      // 부채 저장
      if (debt && debt.length > 0) {
        for (const item of debt) {
          if (item.name) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'debt', item.amount || 0]
            )
          }
        }
      }
      
      await client.query('COMMIT')
      
      return NextResponse.json({ success: true })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to update accumulated assets' }, { status: 500 })
  }
}