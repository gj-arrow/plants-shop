import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth-guard';

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
      console.log(`[upload] Файл отклонён: ${file.name}, размер: ${file.size} байт (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      return NextResponse.json({ 
        error: `Файл слишком большой. Максимум 10MB` 
      }, { status: 400 });
    }

    // Создаём директорию для загрузок
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });

    // Проверяем, что директория существует и доступна для записи
    const { access } = await import('fs/promises');
    try {
      await access(uploadsDir, 2); // W_OK = 2
    } catch {
      return NextResponse.json({
        error: `Директория недоступна для записи: ${uploadsDir}`
      }, { status: 500 });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const isHeic = ['heic', 'heif'].includes(fileExtension);
    const outputExt = isHeic ? 'jpg' : fileExtension;
    const filename = `${timestamp}-${randomString}.${outputExt}`;
    const filepath = path.join(uploadsDir, filename);

    // Сохраняем файл (HEIC/HEIF конвертируем в JPEG для совместимости с браузерами)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let savedAs = outputExt;
    if (isHeic) {
      try {
        await sharp(buffer).jpeg({ quality: 90 }).toFile(filepath);
        console.log(`[upload] HEIC конвертирован в JPEG: ${filepath}`);
      } catch (convErr) {
        // Если конвертация не удалась (нет libde265 на хостинге), сохраняем как есть
        console.error(`[upload] Ошибка конвертации HEIC, сохранение в оригинале:`, convErr);
        await writeFile(filepath, buffer);
        savedAs = fileExtension;
      }
    } else {
      await writeFile(filepath, buffer);
    }

    // Возвращаем URL к файлу (через API, чтобы обойти кеширование хостинга)
    const url = `/api/uploads/${filename}`;

    console.log(`[upload] Файл сохранён: ${filepath} (${file.size} байт, сохранён как ${savedAs})`);

    return NextResponse.json({ 
      success: true, 
      url,
      filename 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}
