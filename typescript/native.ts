/**
 * NyatDB native loader (Rust / napi-rs).
 *
 * Build: `npm run build:nyatdb`
 * Gate:  `NYATDB_NATIVE=true` (default off).
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../env.js';
import { logger } from '../shared/logger.js';

const require = createRequire(import.meta.url);

/** Resolve addon dir for both `tsx src/...` and bundled `dist/index.js`. */
function resolveNativeDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(process.cwd(), 'native/nyatdb'),
    join(here, '../../native/nyatdb'), // src/nyatdb/native.ts
    join(here, '../native/nyatdb'), // dist/index.js
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'index.js'))) return dir;
  }
  return candidates[0]!;
}

const NATIVE_DIR = resolveNativeDir();
const NATIVE_ENTRY = join(NATIVE_DIR, 'index.js');

export type NativeOpenOptions = {
  path: string;
  syncEvery?: number;
  poolFrames?: number;
  chatRingMax?: number;
  verifyOnOpen?: boolean;
};

export type NativeEngineStats = {
  pages: number;
  chats: number;
  recalls: number;
  indexed: number;
  lsn: string;
  backend: string;
  schema: number;
  poolCached: number;
  poolDirty: number;
};

export type NativeChatMessage = {
  messageId: number;
  ts: number;
  uid: number;
  role: number;
  roleName: string;
  text: string;
  bodyFormat?: string;
};

export type NativeChatAppend = {
  messageId: number;
  ts: number;
  uid: number;
  role: string;
  text: string;
  bodyFormat?: string;
};

export type NyatDbNativeHandle = {
  path(): string;
  stats(): NativeEngineStats;
  checkpoint(): void;
  verify(): number;
  chatAppend(chatId: number, msg: NativeChatAppend): void;
  chatRecent(chatId: number, limit?: number): NativeChatMessage[];
  chatGet(chatId: number, messageId: number): NativeChatMessage | null;
  chatGetBatch(chatId: number, messageIds: number[]): Array<NativeChatMessage | null>;
  chatTrimKeepLast(chatId: number, keep: number): void;
  hotSet(key: string, value: Buffer, ttlMs?: number): void;
  hotGet(key: string): Buffer | null;
  hotGetString(key: string): string | null;
  hotDel(key: string): void;
  impulseSchedule(
    id: string,
    chatId: number,
    runAt: number,
    kind: string,
    payload: Buffer,
  ): void;
  impulseDue(now?: number, limit?: number): Array<{
    id: string;
    chatId: number;
    runAt: number;
    kind: string;
    payload: number[];
  }>;
  impulseAck(id: string): void;
  bondUpsert(b: { uid: number; chatId: number; score: number; note: string }): void;
  bondList(limit?: number): Array<{ uid: number; chatId: number; score: number; note: string }>;
  recallUpsert(chatId: number, messageId: number, vector: Float64Array | number[], visibility?: number): void;
  recallSearch(
    query: Float64Array | number[],
    chatId?: number | null,
    topK?: number,
  ): Array<{ chatId: number; messageId: number; score: number }>;
  close(skipCheckpoint?: boolean | null): void;
  ping(): string;
};

type NativeModule = {
  NyatDbNative: { open(opts: NativeOpenOptions): NyatDbNativeHandle };
  nativeVersion(): string;
  schemaVersion(): number;
};

let cached: NativeModule | null | undefined;

function tryLoad(): NativeModule | null {
  if (cached !== undefined) return cached;
  if (!existsSync(NATIVE_ENTRY)) {
    cached = null;
    return null;
  }
  try {
    const mod = require(NATIVE_ENTRY) as NativeModule;
    if (!mod?.NyatDbNative) {
      cached = null;
      return null;
    }
    cached = mod;
    return cached;
  } catch (err) {
    cached = null;
    logger.warn({ err }, 'NyatDB native load failed');
    return null;
  }
}

export function isNyatDbNativeAvailable(): boolean {
  return tryLoad() !== null;
}

export function shouldUseNyatDbNative(): boolean {
  return env().NYATDB_NATIVE && isNyatDbNativeAvailable();
}

export function openNyatDbNative(opts: NativeOpenOptions): NyatDbNativeHandle {
  const mod = tryLoad();
  if (!mod) throw new Error('nyatdb_native_unavailable');
  return mod.NyatDbNative.open(opts);
}

export function nativeVersion(): string | null {
  return tryLoad()?.nativeVersion() ?? null;
}
