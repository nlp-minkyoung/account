import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function GET() {
  try {
    const client = await pool.connect()
    
    const result = await client.query(
      'SELECT DISTINCT name FROM variable_expense_categories ORDER BY name'
    )
    
    client.release()
    
    return NextResponse.json(result.rows.map(row => row.name))
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    
    const client = await pool.connect()
    
    const result = await client.query(
      'INSERT INTO variable_expense_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name]
    )
    
    client.release()
    
    return NextResponse.json(result.rows[0] || { name })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    
    const client = await pool.connect()
    
    // 카테고리와 연관된 지출 데이터도 함께 삭제
    await client.query('DELETE FROM variable_expenses WHERE category_name = $1', [name])
    await client.query('DELETE FROM variable_expense_categories WHERE name = $1', [name])
    
    client.release()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}