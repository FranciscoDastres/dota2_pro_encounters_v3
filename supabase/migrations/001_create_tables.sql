-- ─── pro_players ─────────────────────────────────────────────────────────────
-- Caché de datos de jugadores profesionales (se actualiza manualmente o
-- mediante un job periódico).
CREATE TABLE IF NOT EXISTS pro_players (
  account_id  BIGINT       PRIMARY KEY,
  data        JSONB        NOT NULL,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── match_cache ─────────────────────────────────────────────────────────────
-- Resultados de /players/{account_id}/pros por steam_id.
-- TTL de 1 hora, aplicado en la capa de aplicación (cache.service.ts).
CREATE TABLE IF NOT EXISTS match_cache (
  steam_id   BIGINT       PRIMARY KEY,
  pros       JSONB        NOT NULL,
  cached_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para limpiezas por antigüedad (opcional, útil para jobs de purga)
CREATE INDEX IF NOT EXISTS match_cache_cached_at_idx ON match_cache (cached_at);
