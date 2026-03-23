-- Deletes the "سور القرآن" category and its questions, then adds vetted non-duplicate
-- questions to the "القرآن الكريم" category only.
-- This script does not consider questions from "سور القرآن" when deciding duplicates,
-- because that category is removed first as requested.

WITH deleted_surah_questions AS (
  DELETE FROM category_questions
  WHERE category_id IN (
    SELECT id
    FROM categories
    WHERE name = 'سور القرآن'
  )
  RETURNING id
),
deleted_surah_category AS (
  DELETE FROM categories
  WHERE name = 'سور القرآن'
  RETURNING id
),
target_category AS (
  SELECT id
  FROM categories
  WHERE name = 'القرآن الكريم'
  LIMIT 1
),
proposed_questions(question, answer, points) AS (
  VALUES
    ('ما هي السورة الملقبة بـ "عروس القرآن"؟', 'سورة الرحمن', 200),
    ('ما هي السورة الملقبة بـ "قلب القرآن"؟', 'سورة يس', 200),
    ('ما هي السور الملقبة بـ "الزهراوان"؟', 'سورتا البقرة وآل عمران', 200),
    ('ما هي السورة الملقبة بـ "الفاضحة" لأنّها فضحت المنافقين؟', 'سورة التوبة', 200),
    ('ما هي السورة الملقبة بـ "المنجية" أو "الواقية"؟', 'سورة الملك', 200),
    ('ما هي السورة الملقبة بـ "بني إسرائيل"؟', 'سورة الإسراء', 200),
    ('ما هي السورة الملقبة بـ "سورة النعم"؟', 'سورة النحل', 200),
    ('ما هي السورة الملقبة بـ "سورة الملائكة"؟', 'سورة فاطر', 200),
    ('ما هي السورة التي تعدل ثلث القرآن؟', 'سورة الإخلاص', 200),
    ('ما هي السورة التي تعدل ربع القرآن؟', 'سورة الكافرون', 200),
    ('كم عدد السجدات في القرآن الكريم؟', '15 سجدة', 200),
    ('ما هي السورة التي بدأت باسم ثمرتين؟', 'سورة التين', 200),
    ('من هو الصحابي الوحيد الذي ذُكر اسمه صراحة في القرآن؟', 'زيد بن حارثة رضي الله عنه', 200),
    ('ما هي السورة الملقبة بـ "حم السجدة"؟', 'سورة فصلت', 400),
    ('ما هي السور الملقبة بـ "المقشقشتان"؟', 'سورتا الكافرون والإخلاص', 400),
    ('ما هي السورة الملقبة بـ "سورة الغرف"؟', 'سورة الزمر', 400),
    ('ما هي السورة الملقبة بـ "سورة الدهر"؟', 'سورة الإنسان', 400),
    ('ما هي السورة الملقبة بـ "سورة القتال"؟', 'سورة محمد', 400),
    ('ما هي السورة التي نزلت كاملة ويشيعها سبعون ألف ملك؟', 'سورة الأنعام', 400),
    ('ما هي أطول كلمة في القرآن الكريم؟', 'فأسقيناكموه', 400),
    ('ما هو الجبل الذي استوت عليه سفينة نوح عليه السلام؟', 'جبل الجودي', 400),
    ('كم عدد السور المدنية في القرآن؟', '28 سورة', 600),
    ('ما هي السورة التي تسمى "أخت الطويلتين"؟', 'سورة الأعراف', 600),
    ('ما هي السورة التي تسمى "سورة التوديع"؟', 'سورة النصر', 600),
    ('ما هي السورة التي تسمى "سورة الاستجابة"؟', 'سورة الأنبياء', 600),
    ('ما هي القرية التي ذُكرت في القرآن بأنها كانت "آمنة مطمئنة"؟', 'مكة المكرمة', 600),
    ('ما هي الآية التي نزلت في جوف الكعبة؟', 'إن الله يأمركم أن تؤدوا الأمانات إلى أهلها', 600),
    ('ما هي الآية التي تحتوي على جميع حروف اللغة العربية؟', 'الآية 29 من سورة الفتح', 600)
),
normalized_proposed AS (
  SELECT DISTINCT ON (normalized_question)
    question,
    answer,
    points,
    normalized_question
  FROM (
    SELECT
      question,
      answer,
      points,
      regexp_replace(
        translate(trim(lower(question)), '؟!.,،:;"''`()[]{}ـ', ''),
        '\s+',
        ' ',
        'g'
      ) AS normalized_question
    FROM proposed_questions
  ) prepared
  ORDER BY normalized_question, points, question
)
INSERT INTO category_questions (category_id, question, answer, points)
SELECT
  target_category.id,
  normalized_proposed.question,
  normalized_proposed.answer,
  normalized_proposed.points
FROM target_category
JOIN normalized_proposed ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM category_questions existing
  WHERE existing.category_id = target_category.id
    AND regexp_replace(
      translate(trim(lower(existing.question)), '؟!.,،:;"''`()[]{}ـ', ''),
      '\s+',
      ' ',
      'g'
    ) = normalized_proposed.normalized_question
);