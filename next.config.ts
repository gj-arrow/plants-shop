import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // better-sqlite3 не в package.json (ставится --no-save только для локальной
  // разработки на Windows) — не даём бандлеру резолвить его при сборке
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
