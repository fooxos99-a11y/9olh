-- Lists auction categories with their question counts.
-- Useful to verify that the auction seed has been inserted correctly.

SELECT
  auction_categories.name AS category_name,
  COUNT(auction_questions.id) AS question_count
FROM auction_categories
LEFT JOIN auction_questions
  ON auction_questions.category_id = auction_categories.id
GROUP BY auction_categories.id, auction_categories.name
ORDER BY auction_categories.name;