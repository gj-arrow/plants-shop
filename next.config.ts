import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Лимит NPROC 50 на xS-тарифе: один Node-процесс уже ~12-15 тредов.
  // Ограничиваем параллелизм сборки и воркеров, чтобы билд и рантайм не плодили процессы.
  experimental: {
    // Next 15/16: лимитирует число воркеров при сборке/оптимизации (cpus = max workers)
    cpus: 1,
  },
};

export default nextConfig;
