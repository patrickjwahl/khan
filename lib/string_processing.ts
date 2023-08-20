const VARIANT_DELIMITER = '\n';
const TOKEN_DELIMITER = ' ';
const SYNONYM_DELIMITER = ';';
const SYMBOLS_REGEX = /[.,\/#!\?$%\^&;:{}=\-_`~()]/g;
const PUNCTUATION_REGEX = /[¿¡]/g;
const INNER_TOKEN_DELIMITER = '*';

export type WordHintToken = {
    token: string;
    noSpace: boolean;
}

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

export const getTokens = (sentence: string | null): WordHintToken[] => {
    if (!sentence) return [];

    const tokens = stripSymbols(sentence).split(TOKEN_DELIMITER);
    return tokens.flatMap(token => {
        const innerTokens = token.split(INNER_TOKEN_DELIMITER);
        return innerTokens.map((innerToken, index) => ({
            token: innerToken,
            noSpace: index < innerTokens.length - 1
        }));
    });
};

export const getQuestionTokens = (sentence: string | null): string[] => {
    if (!sentence) return [];

    const tokens = sentence.split(TOKEN_DELIMITER);
    return tokens.flatMap(token => token.split(INNER_TOKEN_DELIMITER));
};

export const normalizeAnswer = (answer: string): string => {
    return stripInnerDelimiter(stripSymbols(answer.trim())).toLowerCase();
};

export const stripInnerDelimiter = (sentence: string | null): string => {
    if (!sentence) return '';

    return sentence.replaceAll(INNER_TOKEN_DELIMITER, '');
};