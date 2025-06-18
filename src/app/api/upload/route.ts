import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filePath, buffer);
  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
} 