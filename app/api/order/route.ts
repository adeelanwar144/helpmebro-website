import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json();

  console.log('New order:', body);

  return NextResponse.json({ success: true });
}
