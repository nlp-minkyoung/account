import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function GET() {
  try {
    const client = await pool.connect()
    
    // 초기 자산이 저장되었는지 확인
    const countResult = await client.query('SELECT COUNT(*) as count FROM assets')
    const isSaved = parseInt(countResult.rows[0].count) > 0
    
    const cashResult = await client.query(
      'SELECT * FROM assets WHERE type = $1 ORDER BY created_at',
      ['cash']
    )
    
    const stocksResult = await client.query(
      'SELECT * FROM assets WHERE type = $1 ORDER BY created_at',
      ['stock']
    )
    
    const realEstateResult = await client.query(
      'SELECT * FROM assets WHERE type = $1 ORDER BY created_at',
      ['real_estate']
    )
    
    const debtResult = await client.query(
      'SELECT * FROM assets WHERE type = $1 ORDER BY created_at',
      ['debt']
    )
    
    client.release()
    
    return NextResponse.json({
      isSaved,
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
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cash, stocks, realEstate, debt } = body
    
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // 기존 자산 삭제
      await client.query('DELETE FROM assets')
      
      // 현금성 자산 저장
      if (cash && cash.length > 0) {
        for (const item of cash) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'cash', item.amount]
            )
          }
        }
      }
      
      // 주식 저장
      if (stocks && stocks.length > 0) {
        for (const item of stocks) {
          if (item.name && item.quantity && item.purchasePrice) {
            await client.query(
              'INSERT INTO assets (name, type, amount, quantity, purchase_price) VALUES ($1, $2, $3, $4, $5)',
              [item.name, 'stock', item.quantity * item.purchasePrice, item.quantity, item.purchasePrice]
            )
          }
        }
      }
      
      // 부동산 저장
      if (realEstate && realEstate.length > 0) {
        for (const item of realEstate) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'real_estate', item.amount]
            )
          }
        }
      }
      
      // 부채 저장
      if (debt && debt.length > 0) {
        for (const item of debt) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'debt', item.amount]
            )
          }
        }
      }
      
      // 누적 자산 테이블도 초기화
      await client.query('DELETE FROM accumulated_assets')
      
      // 현금성 자산을 누적 자산에 복사
      if (cash && cash.length > 0) {
        for (const item of cash) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'cash', item.amount]
            )
          }
        }
      }
      
      // 주식을 누적 자산에 복사
      if (stocks && stocks.length > 0) {
        for (const item of stocks) {
          if (item.name && item.quantity && item.purchasePrice) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount, quantity, purchase_price) VALUES ($1, $2, $3, $4, $5)',
              [item.name, 'stock', item.quantity * item.purchasePrice, item.quantity, item.purchasePrice]
            )
          }
        }
      }
      
      // 부동산을 누적 자산에 복사
      if (realEstate && realEstate.length > 0) {
        for (const item of realEstate) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'real_estate', item.amount]
            )
          }
        }
      }
      
      // 부채를 누적 자산에 복사
      if (debt && debt.length > 0) {
        for (const item of debt) {
          if (item.name && item.amount) {
            await client.query(
              'INSERT INTO accumulated_assets (name, type, amount) VALUES ($1, $2, $3)',
              [item.name, 'debt', item.amount]
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
    return NextResponse.json({ error: 'Failed to save assets' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, amount, quantity, purchasePrice } = body
    
    const client = await pool.connect()
    
    const result = await client.query(
      'UPDATE assets SET name = $1, amount = $2, quantity = $3, purchase_price = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, amount || 0, quantity || null, purchasePrice || null, id]
    )
    
    client.release()
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}