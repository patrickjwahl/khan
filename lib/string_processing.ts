const VARIANT_DELIMITER = '\n';
const TOKEN_DELIMITER = ' ';
const SYNONYM_DELIMITER = ';';
const SYMBOLS_REGEX = /[.,\/#!\?$%\^&\*;:{}=\-_`~()]/g;
const PUNCTUATION_REGEX = /[¿¡]/g;

export const getMainVariant = (variants: string | null): string => {
    if (!variants) return '';

    return variants.split(VARIANT_DELIMITER)[0];
};

export const getAllVariants = (variants: string | null): string[] => {
    if (!variants) return [];
    
    return variants.split(VARIANT_DELIMITER);
};

export const getSynonyms = (synonyms: string | null): string[] => {
    if (!synonyms) return [];

    return synonyms.split(SYNONYM_DELIMITER);
};

export const stripSymbols = (value: string | null): string => {
    if (!value) return '';

    return value.replace(SYMBOLS_REGEX, "").replace(PUNCTUATION_REGEX, "");
};

export const getTokens = (sentence: string | null): string[] => {
    if (!sentence) return [];

    return stripSymbols(sentence).split(TOKEN_DELIMITER);
};

export const normalizeAnswer = (answer: string): string => {
    return stripSymbols(answer.trim()).toLowerCase();
};