// Shared spring presets — used instead of tween/linear easing everywhere
// motion appears, so the interface reads as "alive" rather than mechanical.
export const SPRING_SOFT = { type: "spring" as const, stiffness: 220, damping: 28, mass: 0.8 };
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 420, damping: 32 };
export const SPRING_LAZY = { type: "spring" as const, stiffness: 90, damping: 18, mass: 1 };
