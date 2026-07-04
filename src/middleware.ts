import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protege o painel com senha (HTTP Basic) apenas em producao.
// Em dev fica aberto para facilitar. O webhook do WhatsApp e sempre publico.
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/whatsapp")) return NextResponse.next();

  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const [, pass] = atob(auth.slice(6)).split(":");
      if (pass === senha) return NextResponse.next();
    } catch {
      // credencial malformada -> pede de novo
    }
  }

  return new NextResponse("Autenticacao necessaria", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CRM Atende"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
