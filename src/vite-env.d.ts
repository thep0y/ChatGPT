/*
 * author   thepoy
 * file     vite-env.d.ts
 * created  2023-03-21 17:44:02
 * modified 2023-03-23 15:52:54
 */

/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_MESSAGES: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
