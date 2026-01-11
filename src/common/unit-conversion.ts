// Unit conversion utilities
// QEMU uses decimal multipliers: 1G = 1024MB, 1T = 1024GB, etc.

export type MemoryUnit = 'M' | 'G' | 'T';

const getUnitMultiplier = (unit: MemoryUnit): number => {
  const multipliers = {
    M: 1, // 1MB = 1 MB
    G: 1024, // 1GB = 1024 MB
    T: 1024 * 1024, // 1TB = 1,048,576 MB
  };
  return multipliers[unit] || 1;
};

/**
 * Convert from MB (backend format) to display unit
 * @param mb Value in megabytes
 * @param unit Target unit for display
 * @returns Value in the target unit
 */
export const convertFromMB = (mb: number, unit: MemoryUnit): number => {
  return mb / getUnitMultiplier(unit);
};

/**
 * Convert from display unit to MB (backend format)
 * @param value Value in the source unit
 * @param unit Source unit
 * @returns Value in megabytes
 */
export const convertToMB = (value: number, unit: MemoryUnit): number => {
  return Math.round(value * getUnitMultiplier(unit));
};

/**
 * Convert MB to GB for display (decimal conversion)
 * @param mb Value in megabytes
 * @returns Value in gigabytes, rounded to 1 decimal place
 */
export const mbToGB = (mb: number): number => {
  return Math.round((mb / 1024) * 10) / 10;
};

/**
 * Convert MB to Bytes for display
 * @param mb Value in megabytes
 * @returns Value in bytes
 */
export const mbToBytes = (mb: number): number => {
  return mb * 1024 * 1024;
};

/**
 * Get unit options for dropdowns
 */
export const getUnitOptions = () => [
  { value: 'M', label: 'MB' },
  { value: 'G', label: 'GB' },
  { value: 'T', label: 'TB' },
];
