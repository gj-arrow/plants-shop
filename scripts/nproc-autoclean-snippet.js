// nproc-autoclean-snippet.js — вставьте этот блок в САМОЕ НАЧАЛО вашего server.js / app.js
// для ЛЮБОГО Node-сайта на xS-хостинге (50 NPROC). Без SSH, безопасно для нескольких сайтов на одном аккаунте.
//
// Что делает: каждые 30с проверяет, сколько процессов server.js зависло в ЭТОЙ папке (по /proc/<pid>/cwd).
// Если > NPROC_PER_APP_LIMIT (по умолчанию 1) — убивает старые (SIGTERM → SIGKILL).
// Второй сайт при этом НЕ трогается (сравнивает cwd).
//
// Как использовать:
//   1. Скопируйте весь блок ниже в самый верх вашего стартового файла (до require('express'), require('next') и т.д.)
//   2. В ISPmanager для каждого сайта задайте переменные окружения:
//        UV_THREADPOOL_SIZE=2
//        NPROC_PER_APP_LIMIT=1
//        NPROC_GLOBAL_LIMIT=3
//        NODE_OPTIONS=--max-old-space-size=512  (для маленького второго сайта можно 256)
//      И режим: production, экземпляров = 1 (НЕ cluster/PM2)
//   3. Собирайте (npm run build) ЛОКАЛЬНО, не на хостинге — параллельные сборки превышают лимит
//
// Совместимо: Next.js standalone, Express, Fastify, Koa, любой Node.

process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '2';
try { const _sharp = require('sharp'); _sharp.concurrency(1); _sharp.cache({ files: 0 }); } catch {}
process.on('SIGTERM', () => { console.log('[server] SIGTERM — завершаем'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[server] SIGINT — завершаем');  process.exit(0); });

(function () {
  const PER_APP_THRESHOLD = parseInt(process.env.NPROC_PER_APP_LIMIT || '1', 10);
  const GLOBAL_THRESHOLD = parseInt(process.env.NPROC_GLOBAL_LIMIT || '3', 10);
  const INTERVAL_MS = 30000;
  const APP_DIR = __dirname;
  function pidBelongsToThisApp(pid) {
    try { const fs = require('fs'); const cwd = fs.readlinkSync('/proc/' + pid + '/cwd'); return cwd === APP_DIR || cwd.startsWith(APP_DIR + '/'); } catch { return null; }
  }
  function autoClean() {
    try {
      const { execSync } = require('child_process');
      let raw = '';
      try { raw = execSync('pgrep -f "node.*server\\.js" 2>/dev/null || true', { encoding: 'utf8' }); } catch {}
      let allPids = raw.split('\n').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (allPids.length === 0) {
        try {
          const out = execSync('ps -eo pid,command 2>/dev/null || ps aux 2>/dev/null || true', { encoding: 'utf8' });
          allPids = out.split('\n').filter(l => l.includes('server.js') && l.includes('node')).map(l => {
            const m = l.trim().match(/^(\d+)/); return m ? parseInt(m[1], 10) : NaN;
          }).filter(n => !isNaN(n));
        } catch {}
      }
      if (allPids.length === 0) allPids = [process.pid];
      let myPids = [];
      let unknown = false;
      for (const pid of allPids) {
        const belongs = pidBelongsToThisApp(pid);
        if (belongs === true) myPids.push(pid);
        else if (belongs === null) unknown = true;
      }
      if (unknown && myPids.length === 0) myPids = allPids;
      if (myPids.length === 0) myPids = [process.pid];
      if (myPids.length > PER_APP_THRESHOLD) {
        const others = myPids.filter(pid => pid !== process.pid).sort((a, b) => a - b);
        const toKill = others.slice(0, myPids.length - PER_APP_THRESHOLD);
        if (toKill.length) {
          console.log('[autoclean] per-app: ' + myPids.length + '/' + PER_APP_THRESHOLD + ' в ' + APP_DIR + ', убиваю ' + toKill.join(','));
          toKill.forEach(pid => { try { process.kill(pid, 'SIGTERM'); } catch { try { execSync('kill ' + pid + ' 2>/dev/null || true'); } catch {} } });
          setTimeout(() => { toKill.forEach(pid => { try { process.kill(pid, 0); process.kill(pid, 'SIGKILL'); } catch {} try { execSync('kill -9 ' + pid + ' 2>/dev/null || true'); } catch {} }); }, 2500);
        }
      }
      try {
        let totalNode = 0;
        try { const c = execSync('pgrep -c node 2>/dev/null || pgrep -f node 2>/dev/null | wc -l', { encoding: 'utf8' }); totalNode = parseInt(c.trim(), 10) || 0; } catch { totalNode = allPids.length; }
        if (totalNode > GLOBAL_THRESHOLD) console.log('[autoclean] global: всего node ' + totalNode + '/' + GLOBAL_THRESHOLD + ' — проверь второй сайт, ставь NPROC_PER_APP_LIMIT=1 и UV_THREADPOOL_SIZE=2');
      } catch {}
    } catch {}
  }
  setTimeout(autoClean, 7000);
  setInterval(autoClean, INTERVAL_MS);
})();
