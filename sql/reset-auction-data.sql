-- Resets all auction data so categories and questions can be seeded again cleanly.
-- Run this first, then run sql/add-auction-category-questions.sql

BEGIN;

DELETE FROM used_questions
WHERE game_type = 'auction';

DELETE FROM auction_questions;

DELETE FROM auction_categories;

COMMIT;