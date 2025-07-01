import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import shapeData from "./shapes.js";

// Add CSS for shake animation
const shakeStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-20px); }
    20%, 40%, 60%, 80% { transform: translateX(20px); }
  }
  
  .animate-shake {
    animation: shake 0.6s ease-in-out;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = shakeStyles;
    document.head.appendChild(styleElement);
}

const shapes = shapeData.map(group => {
    return () => (
        <g>
            {group.map((shape, index) => {
                return (
                    <path key={index} d={shape.d} />
                )
            })}
        </g>
    )
})

shapes.length

// Define 3 words as subsets of letter indexes - now scrambled
const WORDS = [
    {
        name: 'FLOW',
        letterIndexes: [17, 2, 1, 6], 
        solved: false
    },
    {
        name: 'SURRENDER',
        letterIndexes: [
            0,
            18,
            22,
            12,
            14,
            11,
            21,
            10,
            7
        ],
        solved: false
    },
    {
        name: 'DISCIPLINE',
        letterIndexes: [
            20,
            8,
            9,
            4,
            13,
            19,
            15,
            3,
            16,
            5,
        ],
        solved: false
    }
];

// Create a mapping from letter index to letter for each word
const LETTER_MAPPINGS = {};
WORDS.forEach(word => {
    word.letterIndexes.forEach((index, i) => {
        LETTER_MAPPINGS[index] = word.name[i];
    });
});

const initialState = {
    letterColors: new Array(shapes.length).fill(0),
    globalColorIndex: 0,
    colors: [
        "#ef4444",
        "#3b82f6",
        "#10b981",
    ],
    selectedLetters: [], // Changed from Set to Array to maintain order
    selectionHistory: [[]], // Changed from Set to Array
    historyIndex: 0,
    isPressed: false,
    currentPressId: null,
    lastTogglePressIds: {},
    isDragging: false,
    dragStartState: null,
    // Word puzzle state
    words: WORDS,
    solvedLetters: new Set(), // Letters that are part of solved words
    isShaking: false, // New state for shake animation
};

const ACTIONS = {
    RESET: 'RESET',
    TOGGLE_LETTER_SELECTION: 'TOGGLE_LETTER_SELECTION',
    SET_PRESSED: 'SET_PRESSED',
    SET_UNPRESSED: 'SET_UNPRESSED',
    UNDO: 'UNDO',
    START_DRAG: 'START_DRAG',
    END_DRAG: 'END_DRAG',
    SOLVE_WORD: 'SOLVE_WORD',
    SHAKE_SELECTION: 'SHAKE_SELECTION', // New action
    RESET_SHAKE: 'RESET_SHAKE', // New action to reset shake state
};

// Pure reducer function - only handles state updates
function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.RESET:
            return {
                ...state,
                selectedLetters: [],
                selectionHistory: [...state.selectionHistory.slice(0, state.historyIndex + 1), []],
                historyIndex: state.historyIndex + 1,
                isDragging: false,
                dragStartState: null,
            };
            
        case ACTIONS.TOGGLE_LETTER_SELECTION: {
            const { letterIndex, pressId, newSelectedLetters, newLastTogglePressIds, shouldUpdate } = action.payload;
            
            if (!shouldUpdate) {
                return state;
            }
            
            // Check if current selection matches any word
            const matchedWord = action.payload.matchedWord;
            if (matchedWord) {
                const { updatedWords, newSolvedLetters } = action.payload.solveResult;
                return {
                    ...state,
                    selectedLetters: [],
                    words: updatedWords,
                    solvedLetters: newSolvedLetters,
                };
            }

            // Only save to history if not dragging (single clicks)
            if (!state.isDragging) {
                return {
                    ...state,
                    selectedLetters: newSelectedLetters,
                    lastTogglePressIds: newLastTogglePressIds,
                    selectionHistory: [...state.selectionHistory.slice(0, state.historyIndex + 1), [...newSelectedLetters]],
                    historyIndex: state.historyIndex + 1,
                };
            } else {
                // During drag, just update the current state without saving to history
                return {
                    ...state,
                    selectedLetters: newSelectedLetters,
                    lastTogglePressIds: newLastTogglePressIds,
                };
            }
        }
        
        case ACTIONS.SOLVE_WORD: {
            const { updatedWords, newSolvedLetters } = action.payload;
            
            return {
                ...state,
                words: updatedWords,
                solvedLetters: newSolvedLetters,
                selectedLetters: [],
            };
        }
        
        case ACTIONS.SHAKE_SELECTION: {
            return {
                ...state,
                isShaking: true,
                // Don't clear selectedLetters immediately - let the animation show first
            };
        }
        
        case ACTIONS.RESET_SHAKE: {
            return {
                ...state,
                isShaking: false,
                selectedLetters: [], // Clear selection after animation
            };
        }
        
        case ACTIONS.SET_PRESSED:
            return {
                ...state,
                isPressed: true,
                currentPressId: Math.random().toString(36).substr(2, 9),
            };
            
        case ACTIONS.SET_UNPRESSED:
            return {
                ...state,
                isPressed: false,
            };
            
        case ACTIONS.START_DRAG:
            return {
                ...state,
                isDragging: true,
                dragStartState: [...state.selectedLetters],
            };
            
        case ACTIONS.END_DRAG:
            return {
                ...state,
                isDragging: false,
                dragStartState: null,
                selectionHistory: [...state.selectionHistory.slice(0, state.historyIndex + 1), [...state.selectedLetters]],
                historyIndex: state.historyIndex + 1,
            };
            
        case ACTIONS.UNDO:
            if (state.historyIndex > 0) {
                const newHistoryIndex = state.historyIndex - 1;
                return {
                    ...state,
                    selectedLetters: [...state.selectionHistory[newHistoryIndex]],
                    historyIndex: newHistoryIndex,
                    isDragging: false,
                    dragStartState: null,
                };
            }
            return state;
            
        default:
            return state;
    }
}

const AppContext = createContext();

// Custom hook for word puzzle logic
function useWordPuzzle() {
    const checkWordMatch = useCallback((selectedLetters, words) => {
        for (const word of words) {
            if (!word.solved && selectedLetters.length === word.letterIndexes.length) {
                // Convert selected letter indexes to their corresponding letters
                const selectedLetterChars = selectedLetters.map(index => LETTER_MAPPINGS[index]);
                
                // Check if the selected letters can form the word (allowing same letters to be reordered)
                const wordLetters = [...word.name.split('')]; // Create a copy to modify
                const canFormWord = selectedLetterChars.every(selectedChar => {
                    const index = wordLetters.indexOf(selectedChar);
                    if (index !== -1) {
                        wordLetters.splice(index, 1); // Remove the matched letter
                        return true;
                    }
                    return false;
                });
                
                if (canFormWord && wordLetters.length === 0) {
                    return word;
                }
            }
        }
        return null;
    }, []);

    const solveWord = useCallback((word, words, solvedLetters) => {
        const newSolvedLetters = new Set(solvedLetters);
        word.letterIndexes.forEach(index => newSolvedLetters.add(index));
        
        const updatedWords = words.map(w => 
            w.name === word.name ? { ...w, solved: true } : w
        );
        
        return { updatedWords, newSolvedLetters };
    }, []);

    return { checkWordMatch, solveWord };
}

// Custom hook for letter selection logic
function useLetterSelection() {
    const toggleLetterSelection = useCallback((letterIndex, selectedLetters, solvedLetters, lastTogglePressIds, pressId) => {
        // Don't allow selection of solved letters
        if (solvedLetters.has(letterIndex)) {
            return { shouldUpdate: false };
        }
        
        // Prevent duplicate toggles from same press
        if (lastTogglePressIds[letterIndex] === pressId) {
            return { shouldUpdate: false };
        }
        
        const newSelectedLetters = [...selectedLetters];
        
        // Only add letter if not already selected
        if (!newSelectedLetters.includes(letterIndex)) {
            newSelectedLetters.push(letterIndex);
        }

        const newLastTogglePressIds = { ...lastTogglePressIds };
        newLastTogglePressIds[letterIndex] = pressId;

        return { 
            shouldUpdate: true, 
            newSelectedLetters, 
            newLastTogglePressIds 
        };
    }, []);

    return { toggleLetterSelection };
}

function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { checkWordMatch, solveWord } = useWordPuzzle();
    const { toggleLetterSelection } = useLetterSelection();

    const randomizeAllColors = useCallback(() => {
        dispatch({ type: ACTIONS.RESET });
    }, []);

    const handleToggleLetterSelection = useCallback((letterIndex) => {
        const toggleResult = toggleLetterSelection(
            letterIndex, 
            state.selectedLetters, 
            state.solvedLetters, 
            state.lastTogglePressIds, 
            state.currentPressId
        );
        
        if (!toggleResult.shouldUpdate) {
            return;
        }
        
        const { newSelectedLetters, newLastTogglePressIds } = toggleResult;
        
        // Check if current selection matches any word
        const matchedWord = checkWordMatch(newSelectedLetters, state.words);
        let solveResult = null;
        
        if (matchedWord) {
            solveResult = solveWord(matchedWord, state.words, state.solvedLetters);
        } else if (newSelectedLetters.length > 0) {
            // Check if the current selection could potentially match any word
            const couldMatchAnyWord = state.words.some(word => {
                if (word.solved) return false;
                
                // Convert selected letter indexes to their corresponding letters
                const selectedLetterChars = newSelectedLetters.map(index => LETTER_MAPPINGS[index]);
                
                // Check if the selected letters could form the beginning of any word
                // by checking if we can match the first N letters of the word
                const wordStart = word.name.split('').slice(0, selectedLetterChars.length);
                
                // Count letter frequencies in both the selected letters and the word start
                const wordStartCounts = {};
                wordStart.forEach(letter => {
                    wordStartCounts[letter] = (wordStartCounts[letter] || 0) + 1;
                });
                
                const selectedLetterCounts = {};
                selectedLetterChars.forEach(letter => {
                    selectedLetterCounts[letter] = (selectedLetterCounts[letter] || 0) + 1;
                });
                
                // Check if we have the right letters to form the word start
                return Object.keys(selectedLetterCounts).every(letter => {
                    return (wordStartCounts[letter] || 0) >= selectedLetterCounts[letter];
                }) && Object.keys(wordStartCounts).every(letter => {
                    return (selectedLetterCounts[letter] || 0) >= wordStartCounts[letter];
                });
            });
            
            if (!couldMatchAnyWord) {
                // Allow the selection first, then shake and deselect after delay
                dispatch({ 
                    type: ACTIONS.TOGGLE_LETTER_SELECTION, 
                    payload: { 
                        letterIndex, 
                        pressId: state.currentPressId,
                        newSelectedLetters,
                        newLastTogglePressIds,
                        shouldUpdate: toggleResult.shouldUpdate,
                        matchedWord: null,
                        solveResult: null
                    } 
                });
                
                // Trigger shake animation after a short delay
                setTimeout(() => {
                    dispatch({ type: ACTIONS.SHAKE_SELECTION });
                    // Reset shake state and clear selection after animation
                    setTimeout(() => {
                        dispatch({ type: ACTIONS.RESET_SHAKE });
                    }, 600); // Increased from 500ms to 600ms to ensure full animation
                }, 300); // This ensures shake starts no earlier than 100ms after click
                
                return;
            }
        }

        dispatch({ 
            type: ACTIONS.TOGGLE_LETTER_SELECTION, 
            payload: { 
                letterIndex, 
                pressId: state.currentPressId,
                newSelectedLetters,
                newLastTogglePressIds,
                shouldUpdate: toggleResult.shouldUpdate,
                matchedWord,
                solveResult
            } 
        });
    }, [state.selectedLetters, state.solvedLetters, state.lastTogglePressIds, state.currentPressId, state.words, toggleLetterSelection, checkWordMatch, solveWord]);

    const setPressed = useCallback(() => {
        dispatch({ type: ACTIONS.SET_PRESSED });
    }, []);

    const setUnpressed = useCallback(() => {
        dispatch({ type: ACTIONS.SET_UNPRESSED });
    }, []);

    const undo = useCallback(() => {
        dispatch({ type: ACTIONS.UNDO });
    }, []);

    const startDrag = useCallback(() => {
        dispatch({ type: ACTIONS.START_DRAG });
    }, []);

    const endDrag = useCallback(() => {
        dispatch({ type: ACTIONS.END_DRAG });
    }, []);

    const solveWordAction = useCallback((word) => {
        const solveResult = solveWord(word, state.words, state.solvedLetters);
        dispatch({ type: ACTIONS.SOLVE_WORD, payload: solveResult });
    }, [state.words, state.solvedLetters, solveWord]);

    const value = useMemo(() => ({
        ...state,
        randomizeAllColors,
        toggleLetterSelection: handleToggleLetterSelection,
        setPressed,
        setUnpressed,
        undo,
        startDrag,
        endDrag,
        solveWord: solveWordAction,
    }), [
        state,
        randomizeAllColors,
        handleToggleLetterSelection,
        setPressed,
        setUnpressed,
        undo,
        startDrag,
        endDrag,
        solveWordAction
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

function Letter({ children, letterIndex }) {
    const {
        selectedLetters,
        toggleLetterSelection,
        isPressed,
        solvedLetters,
        words,
        isShaking,
    } = useAppContext();

    const isSelected = useMemo(() => selectedLetters.includes(letterIndex), [selectedLetters, letterIndex]);
    const isSolved = useMemo(() => solvedLetters.has(letterIndex), [solvedLetters, letterIndex]);

    const handleClick = (event) => {
        event.stopPropagation();
        toggleLetterSelection(letterIndex);
    };

    // Determine styling based on state
    let fillColor = "blue";
    let strokeColor = "none";
    let strokeWidth = 0;
    let opacity = 1;

    if (isSolved) {
        // Solved letters have colored outline and no fill
        const solvedWord = words.find(word => word.letterIndexes.includes(letterIndex));
        if (solvedWord) {
            strokeColor = solvedWord.solved ? "white" : "blue";
            strokeWidth = 15;
            fillColor = "none";
        }
    } else if (isSelected) {
        fillColor = "white";
    }

    // Apply shake animation to all selected letters when shaking
    const shouldShake = isShaking && isSelected;

    return (
        <g
            className={`cursor-pointer ${shouldShake ? 'animate-shake' : ''}`}
            data-letter-index={letterIndex}
            onClick={handleClick}
            style={{ 
                fill: fillColor,
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                opacity: opacity
            }}
        >
            {children}
        </g>
    );
}

function ControlPanel() {
    const {
        randomizeAllColors,
        words,
    } = useAppContext();

    return (
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
            <div className="">
                <h4 className="font-semibold mb-2">Words Found:</h4>
                {words.map((word, index) => (
                    <div key={word.name} className="flex items-center gap-2 text-sm">
                        <span className={`w-3 h-3 rounded-full ${word.solved ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        <span className={word.solved ? 'line-through text-green-300' : 'text-gray-300'}>
                            {word.solved ? word.name : '???'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AppContent() {
    const { setPressed, toggleLetterSelection, setUnpressed, undo, startDrag, endDrag } = useAppContext();
    const svgRef = useRef(null);
    const lastMousePos = useRef(null);

    // Add keyboard event handling for undo
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
                event.preventDefault();
                undo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [undo]);

    const isPointInLetter = (x, y) => {
        if (!svgRef.current) return -1;
        
        const elementAtPoint = document.elementFromPoint(x, y);
        if (elementAtPoint) {
            const svg = svgRef.current;
            let currentElement = elementAtPoint;
            while (currentElement && currentElement !== svg) {
                if (currentElement.tagName === 'g' && currentElement.parentElement === svg) {
                    const letterIndex = currentElement.getAttribute('data-letter-index');
                    if (letterIndex !== null) {
                        return parseInt(letterIndex);
                    }
                }
                currentElement = currentElement.parentElement;
            }
        }
        return -1;
    };

    const pageToSvgCoordinates = (pageX, pageY) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        
        const pt = svg.createSVGPoint();
        pt.x = pageX;
        pt.y = pageY;
        
        const svgPt = pt.matrixTransform(ctm.inverse());
        
        return { x: svgPt.x, y: svgPt.y };
    };

    const svgToPageCoordinates = (svgX, svgY) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        
        const svg = svgRef.current;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        
        const pt = svg.createSVGPoint();
        pt.x = svgX;
        pt.y = svgY;
        
        const pagePt = pt.matrixTransform(ctm);
        
        return { x: pagePt.x, y: pagePt.y };
    };

    const checkLineIntersection = (startX, startY, endX, endY) => {
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const steps = Math.max(1, Math.floor(distance / 3));
        const touchedLetters = new Set();
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startX + t * (endX - startX);
            const y = startY + t * (endY - startY);
            
            const letterIndex = isPointInLetter(x, y);
            if (letterIndex !== -1) {
                touchedLetters.add(letterIndex);
            }
        }
        
        return Array.from(touchedLetters);
    };

    const findNearestLetter = (clickX, clickY) => {
        const svgClick = pageToSvgCoordinates(clickX, clickY);
        
        const directHit = isPointInLetter(clickX, clickY);
        if (directHit !== -1) {
            return directHit;
        }

        const maxRadius = 500;
        const radiusStep = 5;
        const pointsPerCircle = 16;

        for (let radius = radiusStep; radius <= maxRadius; radius += radiusStep) {
            let foundLetter = false;
            let foundIndex = -1;
            
            for (let i = 0; i < pointsPerCircle; i++) {
                const angle = (i * 2 * Math.PI) / pointsPerCircle;
                const svgCheckX = svgClick.x + radius * Math.cos(angle);
                const svgCheckY = svgClick.y + radius * Math.sin(angle);
                
                const pageCheck = svgToPageCoordinates(svgCheckX, svgCheckY);
                
                const letterIndex = isPointInLetter(pageCheck.x, pageCheck.y);
                if (letterIndex !== -1) {
                    foundLetter = true;
                    foundIndex = letterIndex;
                    break;
                }
            }
            
            if (foundLetter) {
                return foundIndex;
            }
        }

        return -1;
    };

    const handleSvgClick = (event) => {
        const nearestLetterIndex = findNearestLetter(event.clientX, event.clientY);
        
        if (nearestLetterIndex !== -1) {
            toggleLetterSelection(nearestLetterIndex);
        }
    };

    const handleMouseMove = (event) => {
        if (!lastMousePos.current) return;
        
        const currentPos = { x: event.clientX, y: event.clientY };
        const lastPos = lastMousePos.current;
        
        const touchedLetters = checkLineIntersection(
            lastPos.x, lastPos.y, 
            currentPos.x, currentPos.y
        );
        
        touchedLetters.forEach(letterIndex => {
            toggleLetterSelection(letterIndex);
        });
        
        lastMousePos.current = currentPos;
    };

    React.useEffect(() => {
        const handleMouseDown = (event) => {
            setPressed();
            startDrag();
            lastMousePos.current = { x: event.clientX, y: event.clientY };
        };

        const handleMouseUp = () => {
            setUnpressed();
            endDrag();
            lastMousePos.current = null;
        };

        const handleTouchStart = (event) => {
            setPressed();
            startDrag();
            if (event.touches[0]) {
                lastMousePos.current = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            }
        };

        const handleTouchEnd = () => {
            setUnpressed();
            endDrag();
            lastMousePos.current = null;
        };

        const handleTouchMove = (event) => {
            if (!lastMousePos.current) return;
            
            const touch = event.touches[0];
            if (!touch) return;
            
            const currentPos = { x: touch.clientX, y: touch.clientY };
            const lastPos = lastMousePos.current;
            
            const touchedLetters = checkLineIntersection(
                lastPos.x, lastPos.y, 
                currentPos.x, currentPos.y
            );
            
            touchedLetters.forEach(letterIndex => {
                toggleLetterSelection(letterIndex);
            });
            
            lastMousePos.current = currentPos;
        };

        const handleDoubleClick = (event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('click', handleSvgClick);
        document.addEventListener('dblclick', handleDoubleClick);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('click', handleSvgClick);
            document.removeEventListener('dblclick', handleDoubleClick);
        };
    }, [setPressed, toggleLetterSelection]);

    return (
        <div className="flex justify-center items-center min-h-screen relative">
            <ControlPanel />
            <div className="w-96 h-96">
                <svg
                    ref={svgRef}
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    viewBox="0 0 4284 5712"
                    className="w-full h-full object-contain cursor-pointer overflow-visible"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {shapes.map((Shape, index) => (
                        <Letter key={index} letterIndex={index}>
                            <Shape />
                        </Letter>
                    ))}
                </svg>
            </div>
        </div>
    );
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
