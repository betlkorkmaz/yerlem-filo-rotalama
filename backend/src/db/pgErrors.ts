// PostgreSQL hata kodları: https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = '23505';

interface PgError {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as PgError;
  return e?.code === UNIQUE_VIOLATION && (!constraint || e.constraint === constraint);
}
