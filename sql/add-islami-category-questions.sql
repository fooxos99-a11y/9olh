-- Adds vetted non-duplicate questions to the "إسلامي" category.
-- Re-running this script will not duplicate any existing normalized question text in the same category.

WITH target_category AS (
  SELECT id
  FROM categories
  WHERE name = 'إسلامي'
  LIMIT 1
),
proposed_questions(question, answer, points) AS (
  VALUES
    ('ما هي المهنة التي عمل بها النبي ﷺ في شبابه قبل التجارة؟', 'رعي الغنم', 200),
    ('ما هو الذبح الذي يُذبح عن المولود في يومه السابع؟', 'العقيقة', 200),
    ('من هو أكثر الصحابة رواية للحديث الشريف؟', 'أبو هريرة رضي الله عنه', 200),
    ('من هو مؤلف كتاب "الموطأ"؟', 'الإمام مالك بن أنس', 200),
    ('من هو الملك الموكل بالنفخ في الصور؟', 'إسرافيل عليه السلام', 200),
    ('ما هو اسم خازن الجنة؟', 'رضوان', 200),
    ('ما هو اسم خازن النار؟', 'مالك', 200),
    ('من هما الملكان الموكلان بسؤال العبد في القبر؟', 'منكر ونكير', 200),
    ('من هي حاضنة النبي ﷺ التي قال عنها "هي أمي بعد أمي"؟', 'أم أيمن بركة الحبشية', 400),
    ('كم عدد أبناء النبي ﷺ ذكورًا وإناثًا؟', '7 أبناء: 3 ذكور و4 إناث', 400),
    ('ما هو اسم العام الذي توفيت فيه خديجة بنت خويلد وأبو طالب؟', 'عام الحزن', 400),
    ('ما هي أطول رحلة في تاريخ الإسلام؟', 'رحلة الإسراء والمعراج', 400),
    ('ما هي أعظم كرامة لأهل الجنة؟', 'رؤية وجه الله الكريم', 400),
    ('ما هو المسجد الذي تُعادل الصلاة فيه مئة ألف صلاة؟', 'المسجد الحرام', 400),
    ('ما هو المسجد الذي تُعادل الصلاة فيه ألف صلاة؟', 'المسجد النبوي', 400),
    ('ما هو المسجد الذي تُعادل الصلاة فيه خمسمائة صلاة؟', 'المسجد الأقصى', 400),
    ('ما هو البيت المعمور؟', 'بيت في السماء السابعة يطوف به الملائكة', 400),
    ('من هو الصحابي الذي نزل جبريل عليه السلام على صورته؟', 'دحية الكلبي رضي الله عنه', 400),
    ('من هو الخليفة الذي أنشأ ديوان الجند وأول من وضع التاريخ الهجري؟', 'عمر بن الخطاب رضي الله عنه', 400),
    ('ما هو اسم فرس النبي ﷺ الذي اشتراه من أعرابي وشهد له خزيمة بن ثابت؟', 'المرتجز', 600),
    ('كم مرة اعتمر النبي ﷺ بعد الهجرة؟', '4 عمرات', 600),
    ('من هي الزوجة التي نزل جبريل بصورتها في حريرة للنبي ﷺ؟', 'عائشة بنت أبي بكر رضي الله عنها', 600),
    ('كم مرة ذُكر اسم محمد في القرآن الكريم؟', '4 مرات', 600),
    ('من هو الصحابي الذي قال عنه النبي ﷺ: أفرضكم فلان؟', 'زيد بن ثابت رضي الله عنه', 600),
    ('ما هو اسم صحيح البخاري الكامل كما وضعه الإمام البخاري؟', 'الجامع المسند الصحيح المختصر من أمور رسول الله ﷺ وسننه وأيامه', 600),
    ('من هو التابعي الذي قيل فيه: يأتيكم رجل من اليمن كان بارًا بأمه؟', 'أويس القرني', 600),
    ('في أي غزوة فُقد عقد عائشة رضي الله عنها ووقعت حادثة الإفك؟', 'غزوة بني المصطلق', 600),
    ('في أي مكان تمت مبايعة أبي بكر الصديق بالخلافة فور وفاة النبي ﷺ؟', 'سقيفة بني ساعدة', 600)
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