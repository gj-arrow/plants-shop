import { run, queryOne } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const newUsername = process.argv[2];
  const newPassword = process.argv[3];

  if (!newUsername || !newPassword) {
    console.error('Укажите новый логин и пароль:');
    console.error('  npm run change-admin <логин> <пароль>');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  const existing = await queryOne<{ id: number }>('SELECT id FROM admins LIMIT 1');

  if (existing) {
    await run('UPDATE admins SET username = ?, password_hash = ? WHERE id = ?', [
      newUsername,
      hash,
      existing.id,
    ]);
    console.log(`Данные администратора обновлены:`);
    console.log(`  Логин: ${newUsername}`);
    console.log(`  Пароль: ${newPassword}`);
  } else {
    await run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [
      newUsername,
      hash,
    ]);
    console.log(`Администратор создан:`);
    console.log(`  Логин: ${newUsername}`);
    console.log(`  Пароль: ${newPassword}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
