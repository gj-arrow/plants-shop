import { initDatabase } from '../src/lib/db';

async function main() {
  console.log('Инициализация базы данных...');
  await initDatabase();
  console.log('База данных успешно инициализирована!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Ошибка инициализации:', err);
  process.exit(1);
});
