-- Adds vetted non-duplicate questions to the "أسئلة عامة" category.
-- The insert skips any row whose normalized question text already exists in the same category.

WITH target_category AS (
  SELECT id
  FROM categories
  WHERE name = 'أسئلة عامة'
  LIMIT 1
),
proposed_questions(question, answer, points) AS (
  VALUES
    ('ما هي أكبر قارة في العالم من حيث المساحة؟', 'قارة آسيا', 200),
    ('ما هي الدولة التي تمتلك أكبر عدد من السكان في العالم؟', 'الهند', 200),
    ('ما هي عاصمة اليابان؟', 'طوكيو', 200),
    ('في أي قارة تقع دولة البرازيل؟', 'أمريكا الجنوبية', 200),
    ('ما هو أصغر بلد في العالم من حيث المساحة؟', 'دولة الفاتيكان', 200),
    ('ما هو البحر الذي يفصل بين قارتي أفريقيا وأوروبا؟', 'البحر الأبيض المتوسط', 200),
    ('ما هي "عاصمة الضباب"؟', 'لندن', 200),
    ('ما هي الدولة التي تُلقب ببلد المليون شهيد؟', 'الجزائر', 200),
    ('ما هي المادة التي تشكل أغلب جسم الإنسان؟', 'الماء', 200),
    ('من هو النبي الذي لُقب بـ "كليم الله"؟', 'موسى عليه السلام', 200),
    ('ما هو الطائر الذي يضع أكبر بيضة في العالم؟', 'النعامة', 400),
    ('ما هو الغاز المستخدم في إطفاء الحرائق؟', 'ثاني أكسيد الكربون', 400),
    ('ما هو المعدن السائل في درجة الحرارة العادية؟', 'الزئبق', 400),
    ('أين توجد حاسة الشم لدى الثعبان؟', 'في اللسان', 400),
    ('من هو مكتشف أمريكا؟', 'كريستوفر كولومبوس', 400),
    ('ما هو الاسم القديم لمدينة إسطنبول؟', 'القسطنطينية', 400),
    ('أين وقعت معركة عين جالوت؟', 'في فلسطين', 400),
    ('ما هي القبلة الأولى للمسلمين؟', 'المسجد الأقصى', 400),
    ('ما هي الدولة التي فازت بأول كأس عالم لكرة القدم؟', 'الأوروغواي', 400),
    ('من هو اللاعب الملقب بـ "الجوهرة السوداء"؟', 'بيليه', 400),
    ('ما هي اللعبة التي تُعرف بـ "لعبة الملوك"؟', 'الشطرنج', 400),
    ('ما هو الحيوان الذي ينام وعيناه مفتوحتان؟', 'السمك', 400),
    ('من هو أول رجل فضاء في التاريخ؟', 'يوري غاغارين', 600),
    ('من هو أول إنسان مشى على سطح القمر؟', 'نيل أرمسترونغ', 600),
    ('ما هو اسم ناقة الرسول ﷺ؟', 'القصواء', 600),
    ('ما هو أقرب كوكب إلى الشمس؟', 'عطارد', 600),
    ('ما هو الاسم الحقيقي للشاعر الملقب بـ "المتنبي"؟', 'أحمد بن الحسين', 600),
    ('من هو مخترع الهاتف؟', 'ألكسندر غراهام بيل', 600),
    ('ما هو أكبر بحر مغلق في العالم؟', 'بحر قزوين', 600),
    ('ما هو المرض الذي يسمى بالموت الأسود؟', 'الطاعون', 600),
    ('ما هو العنصر الكيميائي الذي يرمز له بالرمز (Au)؟', 'الذهب', 600),
    ('ما هو الغاز الذي يمثل النسبة الأكبر في الغلاف الجوي للأرض؟', 'النيتروجين', 600),
    ('ما هو الكوكب الذي يلقب بـ "توأم الأرض" لتقارب حجمه معها؟', 'كوكب الزهرة', 600),
    ('ما هي الغدة التي تسمى "سيدة الغدد" في جسم الإنسان؟', 'الغدة النخامية', 600)
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