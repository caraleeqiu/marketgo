import { NextRequest, NextResponse } from 'next/server';

/**
 * - /admin: HTTP Basic Auth (credenciais no .env)
 * - demais rotas: garante o cookie de sessão anônima zv_sid
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const auth = req.headers.get('authorization') || '';
    const expectedUser = process.env.ADMIN_USER || 'admin';
    const expectedPass = process.env.ADMIN_PASS || '';
    let ok = false;
    if (expectedPass && auth.startsWith('Basic ')) {
      const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
      ok = user === expectedUser && pass === expectedPass;
    }
    if (!ok) {
      return new NextResponse('Autenticação necessária', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="zapvideo-admin"' },
      });
    }
    return NextResponse.next();
  }

  const res = NextResponse.next();
  if (!req.cookies.get('zv_sid')) {
    const sid = 'w' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    res.cookies.set('zv_sid', sid, { maxAge: 60 * 60 * 24 * 90, sameSite: 'lax' });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
