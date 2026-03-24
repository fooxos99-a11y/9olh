import { requireAdminSession } from '@/lib/auth/admin'
import { createAdminClient, hasMatchingServiceRoleConfig } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getReadAuctionCategoriesClient() {
  if (hasMatchingServiceRoleConfig()) {
    return createAdminClient()
  }

  return createClient()
}

async function getWriteAuctionCategoriesClient() {
  if (hasMatchingServiceRoleConfig()) {
    return createAdminClient()
  }

  return createClient()
}

export async function GET() {
  try {
    const supabase = await getReadAuctionCategoriesClient()
    
    const { data, error } = await supabase
      .from('auction_categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching auction categories:', error)
    return NextResponse.json({ error: 'Failed to fetch auction categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession(request, 'إدارة الألعاب')
  if ("response" in auth) {
    return auth.response
  }

  try {
    const supabase = await getWriteAuctionCategoriesClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('auction_categories')
      .insert([{
        name: body.name
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error creating auction category:', error)
    return NextResponse.json({ error: 'Failed to create auction category' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession(request, 'إدارة الألعاب')
  if ("response" in auth) {
    return auth.response
  }

  try {
    const supabase = await getWriteAuctionCategoriesClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('auction_categories')
      .update({
        name: body.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error updating auction category:', error)
    return NextResponse.json({ error: 'Failed to update auction category' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession(request, 'إدارة الألعاب')
  if ("response" in auth) {
    return auth.response
  }

  try {
    const supabase = await getWriteAuctionCategoriesClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error } = await supabase
      .from('auction_categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting auction category:', error)
    return NextResponse.json({ error: 'Failed to delete auction category' }, { status: 500 })
  }
}
