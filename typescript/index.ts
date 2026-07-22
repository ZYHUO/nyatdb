import { env } from '../env.js';
import { logger } from '../shared/logger.js';
import { NyatDb } from './engine.js';
import { NyatDbNativeFacade } from './facade.js';
import {
  isNyatDbNativeAvailable,
  shouldUseNyatDbNative,
  openNyatDbNative,
  nativeVersion,
} from './native.js';

export { NyatDb } from './engine.js';
export { NyatDbNativeFacade } from './facade.js';
export { PAGE_SIZE } from './format/constants.js';
export { RECALL_DIM } from './format/codec.js';
export {
  packChatLogBody,
  unpackChatLogRow,
  chatAppendFromFormatted,
} from './chat-log.js';
export {
  isNyatDbNativeAvailable,
  shouldUseNyatDbNative,
  openNyatDbNative,
  nativeVersion,
} from './native.js';

/** Process-local handle: TS engine or native facade (same dual-write surface). */
export type NyatDbHandle = NyatDb | NyatDbNativeFacade;

let _db: NyatDbHandle | undefined;

function openOpts() {
  return {
    path: env().NYATDB_PATH,
    syncEvery: env().NYATDB_SYNC_EVERY,
    poolFrames: env().NYATDB_POOL_FRAMES,
    chatRingMax: env().NYATDB_CHAT_RING_MAX,
    verifyOnOpen: env().NYATDB_VERIFY_ON_OPEN,
  };
}

export function getNyatDb(): NyatDbHandle | null {
  if (!env().NYATDB_ENABLED) return null;
  if (!_db) {
    const opts = openOpts();
    if (shouldUseNyatDbNative()) {
      const native = openNyatDbNative(opts);
      _db = new NyatDbNativeFacade(native);
      logger.info(
        { path: opts.path, backend: 'native-rust', version: nativeVersion(), stats: _db.stats() },
        'NyatDB opened (native)',
      );
    } else {
      if (env().NYATDB_NATIVE && !isNyatDbNativeAvailable()) {
        logger.warn('NYATDB_NATIVE=true but addon missing; falling back to TS engine');
      }
      _db = NyatDb.open(opts);
      logger.info({ path: opts.path, backend: 'typescript', stats: _db.stats() }, 'NyatDB opened');
    }
  }
  return _db;
}

export function openNyatDb(
  path: string,
  opts?: { syncEvery?: number; poolFrames?: number; preferNative?: boolean },
): NyatDbHandle {
  const open = {
    path,
    syncEvery: opts?.syncEvery ?? 1,
    poolFrames: opts?.poolFrames ?? 32,
  };
  if (opts?.preferNative !== false && isNyatDbNativeAvailable() && (opts?.preferNative || env().NYATDB_NATIVE)) {
    return new NyatDbNativeFacade(openNyatDbNative(open));
  }
  return NyatDb.open(open);
}

export function closeNyatDb(): void {
  if (_db) {
    _db.close({ skipCheckpoint: false });
    _db = undefined;
  }
}
