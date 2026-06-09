import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "/chat";
  const signInUrl = new URL("/api/auth/signin/guest", url.origin);

  signInUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(signInUrl, { status: 303 });
}

export function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
