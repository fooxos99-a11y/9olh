import { createClient } from '@/lib/supabase/server'
import { getRequestSession, unauthorizedResponse } from '@/lib/auth/guards'
import { NextResponse } from 'next/server'

// GET - جلب الأسئلة المستخدمة
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get('gameType')

    if (!gameType) {
      return NextResponse.json({ error: 'Game type is required' }, { status: 400 })
    }

    const session = await getRequestSession(request)
    if (!session) {
      return unauthorizedResponse()
    }

    const { data, error } = await supabase
      .from('used_questions')
      .select('question_id')
      .eq('user_id', session.id)
      .eq('game_type', gameType)

    if (error) throw error

    return NextResponse.json(data.map(item => item.question_id))
  } catch (error) {
    console.error('Error fetching used questions:', error)
    return NextResponse.json({ error: 'Failed to fetch used questions' }, { status: 500 })
  }
}

// POST - إضافة سؤال مستخدم
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { gameType, questionId } = body

    if (!gameType || !questionId) {
      return NextResponse.json({ error: 'Game type and question ID are required' }, { status: 400 })
    }

    const session = await getRequestSession(request)
    if (!session) {
      return unauthorizedResponse()
    }

    const { data, error } = await supabase
      .from('used_questions')
      .insert([{
        user_id: session.id,
        game_type: gameType,
        question_id: questionId
      }])
      .select()

    if (error) {
      // إذا كان السؤال موجود بالفعل، تجاهل الخطأ
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ message: 'Already marked as used' })
      }
      throw error
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error adding used question:', error)
    return NextResponse.json({ error: 'Failed to add used question' }, { status: 500 })
  }
}

// DELETE - حذف جميع الأسئلة المستخدمة (إعادة تعيين)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get('gameType')
    const categoryId = searchParams.get('categoryId')

    if (!gameType) {
      return NextResponse.json({ error: 'Game type is required' }, { status: 400 })
    }

    const session = await getRequestSession(request)
    if (!session) {
      return unauthorizedResponse()
    }

    let questionIds: string[] | null = null

    if (categoryId) {
      if (gameType !== 'categories') {
        return NextResponse.json({ error: 'Category reset is only supported for categories game' }, { status: 400 })
      }

      const { data: categoryQuestions, error: categoryQuestionsError } = await supabase
        .from('category_questions')
        .select('id')
        .eq('category_id', categoryId)

      if (categoryQuestionsError) {
        throw categoryQuestionsError
      }

      questionIds = (categoryQuestions || []).map((item) => item.id)

      if (questionIds.length === 0) {
        return NextResponse.json({ message: 'No questions found for category' })
      }
    }

    let deleteQuery = supabase
      .from('used_questions')
      .delete()
      .eq('user_id', session.id)
      .eq('game_type', gameType)

    if (questionIds) {
      deleteQuery = deleteQuery.in('question_id', questionIds)
    }

    const { error } = await deleteQuery

    if (error) throw error

    return NextResponse.json({ message: categoryId ? 'Category questions reset successfully' : 'Used questions reset successfully' })
  } catch (error) {
    console.error('Error resetting used questions:', error)
    return NextResponse.json({ error: 'Failed to reset used questions' }, { status: 500 })
  }
}
