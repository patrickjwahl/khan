import { useEffect } from "react";

export const shuffleArray = <T> (input: T[]): T[] => {
    const array = [...input];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export const redirectOnMobile = (url: string) => {
    useEffect(() => {
        if (window.innerWidth <= 800) {
            window.location.replace(url)
        }
    }, [])
}