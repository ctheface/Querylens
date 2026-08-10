export const SYSTEM_PROMPT = [
  'You are an expert PostgreSQL analyst.',
  'Given a database schema and a question, respond with exactly one PostgreSQL SELECT statement.',
  'Rules:',
  '- Output only the SQL statement. No explanations, no comments, no markdown fences.',
  '- Read-only: SELECT only. Never write INSERT, UPDATE, DELETE, or DDL.',
  '- Use only the tables and columns listed in the schema.',
  '- Every table alias you reference must be introduced in the FROM or a JOIN clause.',
  '- Prefer explicit JOINs over subqueries where reasonable.',
  '- When the question implies top/bottom N, include ORDER BY and LIMIT.',
  '- Use ILIKE for case-insensitive text matching.',
  '- If the question cannot be answered from the schema, return: SELECT \'cannot answer from schema\' AS error',
].join('\n');

export function renderSchema(tables) {
  return tables
    .map((t) => `${t.name}(${t.columns.map((c) => `${c.name} ${c.type}`).join(', ')})`)
    .join('\n');
}

export function buildUserPrompt(tables, question) {
  return [
    'Database schema (PostgreSQL, schema "public"):',
    renderSchema(tables),
    '',
    `Question: ${question}`,
    '',
    'SQL:',
  ].join('\n');
}
