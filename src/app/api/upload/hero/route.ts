import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile, access } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth-guard';

// POST /api/upload/hero — загрузка верхнего (hero) фото на главной.
// Файл сохраняется под фиксированным именем hero.jpg (перезапись).
// Допустимые форматы конвертируются в JPEG для единообразия.
export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({
        error: 'Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF, HEIC'
      }, { status: 400 });
    }

    // Проверяем размер (макс 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `Файл слишком большой. Максимум 10MB`
      }, { status: 400 });
    }

    // Создаём директорию для загрузок
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });

    try {
      await access(uploadsDir, 2); // W_OK = 2
    } catch {
      return NextResponse.json({
        error: `Директория недоступна для записи: ${uploadsDir}`
      }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Фиксированное имя: hero.jpg (перезапись предыдущего)
    const filepath = path.join(uploadsDir, 'hero.jpg');

    // Всё конвертируем в JPEG (кроме случаев, когда sharp недоступен — тогда сохраняем как есть)
    try {
      await sharp(buffer).jpeg({ quality: 90 }).toFile(filepath);
    } catch (convErr) {
      console.error('[upload/hero] Ошибка конвертации в JPEG, сохраняю оригинал:', convErr);
      await writeFile(filepath, buffer);
    }

    // URL для отображения (прямой путь в public — как у текущего main2.jpeg)
    const url = '/uploads/products/hero.jpg';

    console.log(`[upload/hero] Файл сохранён: ${filepath} (${file.size} байт)`);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Error uploading hero file:', error);
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}
