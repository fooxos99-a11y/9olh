import { requireAdminSession } from '@/lib/auth/admin'
import { createAdminClient, hasMatchingServiceRoleConfig } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AuctionQuestionRow = {
  id: string
  category_id: string
  question: string
  answer: string
  created_at?: string | null
  updated_at?: string | null
}

type AuctionCategoryRow = {
  id: string
  name: string
}

async function getReadAuctionQuestionsClient() {
  if (hasMatchingServiceRoleConfig()) {
    return createAdminClient()
  }

  return createClient()
}

async function getWriteAuctionQuestionsClient() {
  if (hasMatchingServiceRoleConfig()) {
    return createAdminClient()
  }

  return createClient()
}

async function attachCategoriesToQuestions(supabase: Awaited<ReturnType<typeof getReadAuctionQuestionsClient>>, questions: AuctionQuestionRow[]) {
  const categoryIds = Array.from(new Set(questions.map((question) => question.category_id).filter(Boolean)))

  if (categoryIds.length === 0) {
    return questions.map((question) => ({ ...question, category: null }))
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('auction_categories')
    .select('id, name')
    .in('id', categoryIds)

  if (categoriesError) {
    throw categoriesError
  }

  const categoriesById = new Map((categories ?? []).map((category: AuctionCategoryRow) => [category.id, category]))

  return questions.map((question) => ({
    ...question,
    category: categoriesById.get(question.category_id) ?? null,
  }))
}

async function getQuestionWithCategory(
  supabase: Awaited<ReturnType<typeof getWriteAuctionQuestionsClient>>,
  question: AuctionQuestionRow,
) {
  const { data: category, error: categoryError } = await supabase
    .from('auction_categories')
    .select('id, name')
    .eq('id', question.category_id)
    .maybeSingle()

  if (categoryError) {
    throw categoryError
  }

  return {
    ...question,
    category: category ?? null,
  }
}

export async function GET() {
  try {
    const supabase = await getReadAuctionQuestionsClient()
    
    const { data, error } = await supabase
      .from('auction_questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const payload = await attachCategoriesToQuestions(supabase, (data ?? []) as AuctionQuestionRow[])

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching auction questions:', error)
    return NextResponse.json({ error: 'Failed to fetch auction questions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession(request, 'إدارة الألعاب')
  if ("response" in auth) {
    return auth.response
  }

  try {
    const supabase = await getWriteAuctionQuestionsClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('auction_questions')
      .insert([{
        category_id: body.category_id,
        question: body.question,
        answer: body.answer
      }])
      .select('*')
      .single()

    if (error) throw error

    const payload = await getQuestionWithCategory(supabase, data as AuctionQuestionRow)

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error creating auction question:', error)
    return NextResponse.json({ error: 'Failed to create auction question' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession(request, 'إدارة الألعاب')
  if ("response" in auth) {
    return auth.response
  }

  try {
    const supabase = await getWriteAuctionQuestionsClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('auction_questions')
      .update({
        category_id: body.category_id,
        question: body.question,
        answer: body.answer,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select('*')
      .single()

    if (error) throw error

    const payload = await getQuestionWithCategory(supabase, data as AuctionQuestionRow)

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error updating auction question:', error)
    return NextResponse.json({ error: 'Failed to update auction question' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession(request, 'إدارة الألعاب')
  if ("response" in auth) {
    return auth.response
  }

  try {
    const supabase = await getWriteAuctionQuestionsClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error } = await supabase
      .from('auction_questions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting auction question:', error)
    return NextResponse.json({ error: 'Failed to delete auction question' }, { status: 500 })
  }
}
