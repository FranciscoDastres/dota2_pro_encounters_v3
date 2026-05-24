import type {
  ComparisonPosition,
  CoreItemTimingTarget,
  RoleMetadata,
} from './carryComparison.types'

export const CORE_ITEM_TIMINGS_BY_HERO: Record<number, Record<string, CoreItemTimingTarget>> = {
  1: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    bfury: { label: 'Battle Fury', optimalMinute: 14, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 21, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 25, graceMinutes: 3 },
  },
  2: {
    phase_boots: { label: 'Phase Boots', optimalMinute: 8, graceMinutes: 2 },
    blink: { label: 'Blink Dagger', optimalMinute: 14, graceMinutes: 3 },
    blade_mail: { label: 'Blade Mail', optimalMinute: 19, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 25, graceMinutes: 3 },
  },
  6: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    hurricane_pike: { label: 'Hurricane Pike', optimalMinute: 16, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  8: {
    phase_boots: { label: 'Phase Boots', optimalMinute: 7, graceMinutes: 2 },
    maelstrom: { label: 'Maelstrom', optimalMinute: 13, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 20, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 24, graceMinutes: 3 },
  },
  11: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    shadow_sb: { label: 'Shadow Blade', optimalMinute: 15, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  18: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    echo_sabre: { label: 'Echo Sabre', optimalMinute: 13, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 20, graceMinutes: 3 },
  },
  21: {
    arcane_boots: { label: 'Arcane Boots', optimalMinute: 8, graceMinutes: 3 },
    blink: { label: 'Blink Dagger', optimalMinute: 18, graceMinutes: 4 },
    wind_waker: { label: 'Wind Waker', optimalMinute: 35, graceMinutes: 5 },
  },
  27: {
    arcane_boots: { label: 'Arcane Boots', optimalMinute: 9, graceMinutes: 3 },
    blink: { label: 'Blink Dagger', optimalMinute: 18, graceMinutes: 4 },
    aether_lens: { label: 'Aether Lens', optimalMinute: 24, graceMinutes: 4 },
  },
  41: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    maelstrom: { label: 'Maelstrom', optimalMinute: 14, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  44: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    bfury: { label: 'Battle Fury', optimalMinute: 15, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 23, graceMinutes: 3 },
  },
  48: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    mask_of_madness: { label: 'Mask of Madness', optimalMinute: 11, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 19, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 24, graceMinutes: 3 },
  },
  54: {
    phase_boots: { label: 'Phase Boots', optimalMinute: 7, graceMinutes: 2 },
    radiance: { label: 'Radiance', optimalMinute: 16, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 23, graceMinutes: 3 },
  },
  72: {
    power_treads: { label: 'Power Treads', optimalMinute: 7, graceMinutes: 2 },
    maelstrom: { label: 'Maelstrom', optimalMinute: 13, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  74: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    hand_of_midas: { label: 'Hand of Midas', optimalMinute: 11, graceMinutes: 2 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 22, graceMinutes: 3 },
  },
  94: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 18, graceMinutes: 3 },
    butterfly: { label: 'Butterfly', optimalMinute: 27, graceMinutes: 4 },
  },
  109: {
    power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
    manta: { label: 'Manta Style', optimalMinute: 18, graceMinutes: 3 },
    black_king_bar: { label: 'Black King Bar', optimalMinute: 24, graceMinutes: 3 },
  },
}

export const DEFAULT_CORE_TIMINGS: Record<string, CoreItemTimingTarget> = {
  power_treads: { label: 'Power Treads', optimalMinute: 8, graceMinutes: 2 },
  maelstrom: { label: 'Maelstrom', optimalMinute: 14, graceMinutes: 2 },
  black_king_bar: { label: 'Black King Bar', optimalMinute: 23, graceMinutes: 3 },
}

export const ROLE_METADATA: Record<ComparisonPosition, RoleMetadata> = {
  1: {
    title: 'Hard Carry Benchmark',
    label: 'Hard Carry',
    feedback_ok: 'Cumpliste el rol de Hard Carry: tu economía y tus timings están cerca del estándar profesional.',
    feedback_fail: 'Tu ruta de farming está dejando recursos en el mapa',
  },
  2: {
    title: 'Mid Lane Benchmark',
    label: 'Mid',
    feedback_ok: 'Dominaste el Mid: tus niveles y recursos están a la par de un jugador profesional.',
    feedback_fail: 'Como Mid, necesitas mayor impacto en oro y niveles. Mejora tu eficiencia en línea y rotaciones.',
  },
  3: {
    title: 'Offlaner Benchmark',
    label: 'Offlaner',
    feedback_ok: 'Gran desempeño como Offlaner: lograste balancear farm con presencia en el mapa.',
    feedback_fail: 'Tu impacto como Offlaner fue bajo. Necesitas asegurar tus items de utilidad/inicio más rápido.',
  },
  4: {
    title: 'Support Benchmark',
    label: 'Support',
    feedback_ok: 'Excelente trabajo de Support: aportaste impacto con recursos limitados.',
    feedback_fail: 'Como Support, busca participar en más kills y asegurar items clave de utilidad.',
  },
  5: {
    title: 'Hard Support Benchmark',
    label: 'Hard Support',
    feedback_ok: 'Hard Support ejemplar: sacrificaste farm para habilitar a tu equipo con gran eficiencia.',
    feedback_fail: 'Como Hard Support, enfócate en tu posicionamiento y en maximizar tu impacto con pocos recursos.',
  },
}
