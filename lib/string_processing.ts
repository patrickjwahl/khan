export const VARIANT_DELIMITER = '\n';
export const TOKEN_DELIMITER = ' ';
export const SYNONYM_DELIMITER = ';';
export const SYMBOLS_REGEX = /[.,\/#!\?$%\^&;:{}=\-_`~()]/g;
export const PUNCTUATION_REGEX = /[¿¡]/g;
export const INNER_TOKEN_DELIMITER = '*';
export const UNI_QUOTE = '\u2019'

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

    return value.replace(SYMBOLS_REGEX, "").replace(PUNCTUATION_REGEX, "").replace(UNI_QUOTE, '\'');
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

export const splitStringIntoVariations: (input: string) => string[] = (input: string) => {
    const bracketSections = input.match(/\[(.*?)\]/g);
    if (!bracketSections || bracketSections?.length === 0) return [input];

    const bracketVariations = bracketSections[0].slice(1, -1).split('/');
    const variations = bracketVariations.map(v => {
        const newInput = input.replace(/\[(.*?)\]/, v);
        return splitStringIntoVariations(newInput).flat();
    });

    return variations.flat().map(v => v.replace(/ +/g, ' '));
}