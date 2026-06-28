import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
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

    // Проверяем размер (макс 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Файл слишком большой. Максимум 5MB' 
      }, { status: 400 });
    }

    // Создаём директорию для загрузок
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomString}.${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Возвращаем URL к файлу
    const url = `/uploads/products/${filename}`;

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
