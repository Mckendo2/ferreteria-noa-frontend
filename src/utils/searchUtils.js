/**
 * Removes accents/diacritics from a string.
 * Example: "Martillo de construcción" -> "Martillo de construccion"
 */
export const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};

/**
 * Normalizes a string for smart search (lowercase + no accents).
 */
export const normalizeForSearch = (str) => {
    return removeAccents(str || '').toLowerCase();
};
