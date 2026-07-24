import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// GET /api/uploads/[filename] — отдаёт загруженное изображение
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Защита от path traversal
  if (filename.includes('/') || filename.includes('..')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
  const filepath = path.join(uploadsDir, filename);

  if (!existsSync(filepath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const buffer = await readFile(filepath);

    // Определяем Content-Type по расширению
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Error reading file', { status: 500 });
  }
}
