import dotenv from "dotenv"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: path.resolve(".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables in .env.local")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const categoryName = "أندية"
const questions = [
  { question: "من هو أول فريق سعودي شارك في كأس العالم للأندية؟", answer: "النصر", points: 200 },
  { question: "من هو النادي الإسباني الذي يلقب بـ\"الخفافيش\"؟", answer: "فالنسيا", points: 200 },
  { question: "من هو المدرب الذي قاد ريال مدريد لثلاثة ألقاب متتالية في دوري الأبطال؟", answer: "زين الدين زيدان", points: 200 },
  { question: "في أي بلد يقع نادي بايرن ميونخ؟", answer: "ألمانيا", points: 200 },
  { question: "ما هو النادي الأفريقي الذي فاز بدوري أبطال إفريقيا 11 مرة؟", answer: "الأهلي المصري", points: 200 },
  { question: "من هو أكثر نادٍ فاز بالدوري الفرنسي؟", answer: "باريس سان جيرمان", points: 200 },
  { question: "ما هو النادي المصري الذي يُلقب بـ\"فرسان مدينته\"؟", answer: "الزمالك", points: 200 },
  { question: "من هو النادي الذي يُلقب بـ\"الملكي\"؟", answer: "ريال مدريد", points: 200 },
  { question: "من هو النادي الإنجليزي الذي يلقب بـ\"الثعالب\"؟", answer: "ليستر سيتي", points: 200 },
  { question: "من هو أكثر نادٍ حصل على الدوري الإيطالي؟", answer: "يوفنتوس", points: 200 },
  { question: "من هو النادي البرتغالي الذي خرج منه كريستيانو رونالدو؟", answer: "سبورتينغ لشبونة", points: 400 },
  { question: "كم عدد أندية الدوري الإنجليزي الممتاز؟", answer: "20 نادي", points: 400 },
  { question: "من هو النادي الذي يُلقب بـ\"الحيتان\" في الدوري السعودي؟", answer: "الفتح", points: 400 },
  { question: "من هو النادي الإنجليزي الذي يلقب بـ\"البلوز\"؟", answer: "تشيلسي", points: 400 },
  { question: "ما هو اسم ملعب نادي برشلونة؟", answer: "كامب نو", points: 400 },
  { question: "من هو النادي المعروف بـ\"السيدة العجوز\"؟", answer: "يوفنتوس", points: 400 },
  { question: "في أي سنة تأسس نادي ريال مدريد؟", answer: "1902", points: 400 },
  { question: "ما اسم المدرب الذي قاد تشيلسي للفوز بدوري الأبطال عام 2021؟", answer: "توماس توخيل", points: 400 },
  { question: "من هو اللاعب الأسطوري الذي لعب لفريق مانشستر يونايتد وحصل على الكرة الذهبية عام 2008؟", answer: "كريستيانو رونالدو", points: 400 },
  { question: "من هو أول نادٍ فاز بدوري أبطال أوروبا (كأس الأندية الأوروبية سابقًا)؟", answer: "ريال مدريد 1956", points: 400 },
  { question: "ما هو اسم الملعب الرسمي لنادي روما الإيطالي؟", answer: "الأولمبيكو", points: 600 },
  { question: "من هو رئيس نادي برشلونة عام 2009؟", answer: "خوان لابورتا", points: 600 },
  { question: "من هو الفريق الذي هبط من الدوري الإنجليزي وهو بطل أوروبا سابقًا؟", answer: "نوتنغهام فورست", points: 600 },
  { question: "من هو المدرب الذي قاد مانشستر سيتي للفوز بدوري أبطال أوروبا لأول مرة؟", answer: "بيب غوارديولا", points: 600 },
  { question: "في أي عام تأسس نادي أياكس أمستردام؟", answer: "1900", points: 600 },
  { question: "من هو الخصم التقليدي لنادي بوكا جونيورز في الأرجنتين؟", answer: "ريفر بليت", points: 600 },
  { question: "ما هو النادي الذي حصل على لقب الدوري الإنجليزي موسم 2015-2016 بشكل مفاجئ؟", answer: "ليستر سيتي", points: 600 },
  { question: "في أي دولة يقع نادي أياكس؟", answer: "هولندا", points: 600 },
  { question: "ما هو النادي الذي يُلقب بـ\"الغواصات الصفراء\"؟", answer: "فياريال", points: 600 },
  { question: "من هو النادي الذي فاز بأول نسخة من كأس العالم للأندية؟", answer: "كورينثيانز 2000", points: 600 },
]

function normalizeQuestion(value) {
  return value.replace(/\s+/g, " ").trim()
}

let { data: existingCategory, error: categoryError } = await supabase
  .from("categories")
  .select("id, name")
  .eq("name", categoryName)
  .maybeSingle()

if (categoryError) {
  throw categoryError
}

if (!existingCategory) {
  const { data: createdCategory, error: createCategoryError } = await supabase
    .from("categories")
    .insert({ name: categoryName })
    .select("id, name")
    .single()

  if (createCategoryError) {
    throw createCategoryError
  }

  existingCategory = createdCategory
}

const { data: existingQuestions, error: existingQuestionsError } = await supabase
  .from("category_questions")
  .select("id, question")
  .eq("category_id", existingCategory.id)

if (existingQuestionsError) {
  throw existingQuestionsError
}

const existingNormalizedQuestions = new Set(
  (existingQuestions ?? []).map((entry) => normalizeQuestion(entry.question)),
)

const rowsToInsert = questions
  .filter((entry) => !existingNormalizedQuestions.has(normalizeQuestion(entry.question)))
  .map((entry) => ({
    category_id: existingCategory.id,
    question: entry.question,
    answer: entry.answer,
    points: entry.points,
  }))

if (rowsToInsert.length > 0) {
  const { error: insertError } = await supabase.from("category_questions").insert(rowsToInsert)
  if (insertError) {
    throw insertError
  }
}

console.log(
  JSON.stringify(
    {
      projectUrl: supabaseUrl,
      categoryName,
      categoryId: existingCategory.id,
      insertedQuestionCount: rowsToInsert.length,
      skippedExistingCount: questions.length - rowsToInsert.length,
    },
    null,
    2,
  ),
)