import { cookies } from 'next/headers';

/** ID da sessão anônima criado pelo middleware. */
export function sessionId(): string {
  return cookies().get('zv_sid')?.value ?? 'anon';
}
