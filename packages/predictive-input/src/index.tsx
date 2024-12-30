"use client";
import { useState, useEffect, useRef } from "react";
import rawDictionary from "./scored-words.json" assert { type: "json" };

type Dictionary = {
    [key: string]: number;
};

const dictionary = rawDictionary as Dictionary;
const words = Object.keys(dictionary);
type KeyMapping = { [key: string]: string[] };

// Key mapping similar to an old-school phone keypad
const keyMap: KeyMapping = {
    "1": ["a", "b", "c"],
    "2": ["d", "e", "f"],
    "3": ["g", "h", "i"],
    "4": ["j", "k", "l"],
    "5": ["m", "n", "o"],
    "6": ["p", "q", "r", "s"],
    "7": ["t", "u", "v"],
    "8": ["w", "x", "y", "z"],
    "9": [],
    "0": [],
};

// Generate regex pattern based on key sequence
function generatePattern(keys: string, exact: boolean): string {
    let pattern = "^"; // Start-of-word anchor
    for (const key of keys) {
        const letters = keyMap[key];
        if (letters && letters.length > 0) {
            pattern += `[${letters.join("")}]`; // Match any mapped letter
        } else {
            pattern += "."; // Match any character (fallback)
        }
    }

    if (exact) {
        pattern += "$"; // Exact match if fewer than 3 keys
    }

    return pattern; // Pattern for matching words
}

function predictWords(keys: string): string[] {
    if (!keys) return [];

    const exactRegex = new RegExp(generatePattern(keys, true), "i");
    const allRegex = new RegExp(generatePattern(keys, false), "i");
    const allWords = words.filter((word) => allRegex.test(word));
    const sortedWord = allWords.sort((a, b) => {
        const exactMatchA = exactRegex.test(a);
        const exactMatchB = exactRegex.test(b);
        if (exactMatchA && !exactMatchB) return -1;
        if (!exactMatchA && exactMatchB) return 1;
        const scoreA = dictionary[a] ?? 0;
        const scoreB = dictionary[b] ?? 0;
        return scoreB - scoreA;
    });
    if (sortedWord.length > 20) {
        // return first 20
        return sortedWord.slice(0, 20);
    }
    return sortedWord;
}

export const PredictiveInput = () => {
    const timeDuplicatePressed = useRef<number>(0);
    const timePressed = useRef<number>(0);
    const [capIndices, setCapIndices] = useState<number[]>([]);
    const [selectedText, setSelectedText] = useState<string>("");
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const [keys, setKeys] = useState<string>("");
    const [words, setWords] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

    const getWordWithCaps = (word?: string) => {
        if (!word) return "";
        return word
            .split("")
            .map((char, index) => {
                if (capIndices.includes(index)) {
                    return char.toUpperCase();
                }
                return char;
            })
            .join("");
    };
    useEffect(() => {
        setWords(predictWords(keys));
        setCapIndices((prevState) => {
            return prevState.filter((index) => {
                return index < keys.length;
            });
        });
    }, [keys]);

    useEffect(() => {
        if (pressedKeys.size > 1) {
            timeDuplicatePressed.current = Date.now();
        }
    }, [pressedKeys]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (timePressed.current === 0) {
            timePressed.current = Date.now();
        }

        // Update the set of currently pressed keys
        setPressedKeys((prev) => new Set([...prev, e.key]));

        const selectWord =
            (pressedKeys.has("9") && e.key === "0") ||
            (pressedKeys.has("0") && e.key === "9");

        const selectWordWithoutSpace =
            (pressedKeys.has("8") && e.key === "0") ||
            (pressedKeys.has("0") && e.key === "8");

        const deleteKeyCharacter =
            (pressedKeys.has("1") && e.key === "2") ||
            (pressedKeys.has("2") && e.key === "1");

        const deleteWord =
            (pressedKeys.has("8") && e.key === "9") ||
            (pressedKeys.has("9") && e.key === "8");

        const addPunctuation =
            (pressedKeys.has("1") && e.key === "3") ||
            (pressedKeys.has("3") && e.key === "1");

        if (selectWord) {
            setSelectedText((prevState) => {
                const word = getWordWithCaps(words[highlightedIndex]);
                if (!word) return prevState;
                return `${prevState} ${word}`;
            });
            setKeys("");
            setWords([]);
            setPressedKeys(new Set());
            return;
        }

        if (selectWordWithoutSpace) {
            setSelectedText((prevState) => {
                const word = getWordWithCaps(words[highlightedIndex]);
                if (!word) return prevState;
                return `${prevState}${word}`;
            });
            setKeys("");
            setWords([]);
            setPressedKeys(new Set());
            return;
        }

        if (deleteKeyCharacter) {
            setKeys(keys.slice(0, -1));
            return;
        }

        if (deleteWord) {
            setSelectedText((prevState) => {
                const words = prevState.split(" ");
                words.pop();
                return words.join(" ");
            });
        }
        if (addPunctuation) {
            setWords([".", ",", "!", "?"]);
            setHighlightedIndex(0);
            return;
        }
    };

    useEffect(() => {
        if (words.length === 0) {
            setHighlightedIndex(0);
            return;
        }
        if (highlightedIndex < 0) {
            setHighlightedIndex(0);
            return;
        }
        if (highlightedIndex > words.length - 1) {
            setHighlightedIndex(words.length - 1);
            return;
        }
    }, [highlightedIndex]);

    const handleKeyUp = (e: React.KeyboardEvent) => {
        // Remove the released key from the set
        setPressedKeys((prev) => {
            const next = new Set(prev);
            next.delete(e.key);
            return next;
        });
        if (pressedKeys.size > 1) {
            return;
        }

        const wasJustDuplicate =
            Date.now() - timeDuplicatePressed.current < 200;
        const isCap = Date.now() - timePressed.current > 500;
        if (keyMap[e.key]?.length && !wasJustDuplicate) {
            if (isCap) {
                setCapIndices((prev) => [...prev, keys.length]);
            }
            setKeys(keys + e.key);
        }
        timePressed.current = 0;

        const isNine = e.key === "9";
        const isZero = e.key === "0";

        if (isZero) {
            setHighlightedIndex(
                words.length > highlightedIndex + 1 ? highlightedIndex + 1 : 0,
            );
            return;
        }
        if (isNine) {
            setHighlightedIndex(
                highlightedIndex > 0 ? highlightedIndex - 1 : words.length - 1,
            );
            return;
        }
    };

    return (
        <div>
            <div>
                <h1>10 Key Keyboard Input</h1>
                <div>You typed:</div>
                <div style={{ minHeight: "20px" }}>{selectedText}</div>
                <input
                    value={keys}
                    placeholder="Type here..."
                    type="text"
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                />
                <div>
                    {words.map((word, index) => (
                        <div
                            key={word}
                            style={{
                                backgroundColor:
                                    index === highlightedIndex
                                        ? "red"
                                        : "white",
                            }}
                        >
                            {getWordWithCaps(word)}
                        </div>
                    ))}
                </div>
            </div>
            <div
                style={{
                    marginTop: "20px",
                    position: "absolute",
                    top: "0",
                    left: "20px",
                }}
            >
                <details open>
                    <summary>Key</summary>
                    <div>1 - abc</div>
                    <div>2 - def</div>
                    <div>3 - ghi</div>
                    <div>4 - jkl</div>
                    <div>5 - mno</div>
                    <div>6 - pqrs</div>
                    <div>7 - tuv</div>
                    <div>8 - wxyz</div>
                    <div>9 - up</div>
                    <div>0 - down</div>
                    <div>0 + 9 - select word</div>
                    <div>0 + 8 - select word without space</div>
                    <div>1 + 2 - delete key character</div>
                    <div>8 + 9 - delete word</div>
                    <div>1 + 3 - punctuation</div>
                    <div>Hold for 500ms - capitalize</div>
                </details>
            </div>
        </div>
    );
};
