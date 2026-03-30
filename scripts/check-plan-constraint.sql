-- Check current plan constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.jordyn_users'::regclass
  AND contype = 'c'
  AND conname LIKE '%plan%';
