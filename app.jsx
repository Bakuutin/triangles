import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import shapeData from "./shapes.js";

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

const initialState = {
    letterColors: new Array(shapes.length).fill(0),
    globalColorIndex: 0,
    colors: [
        "#ef4444",
        "#3b82f6",
        "#10b981",
    ],
    selectedLetters: new Set(),
    isPressed: false,
    currentPressId: null,
    lastTogglePressIds: {},
};

const ACTIONS = {
    RESET: 'RESET',
    TOGGLE_LETTER_SELECTION: 'TOGGLE_LETTER_SELECTION',
    SET_PRESSED: 'SET_PRESSED',
    SET_UNPRESSED: 'SET_UNPRESSED',
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.RESET:
            return {
                ...state,
                selectedLetters: new Set(),
            };
        case ACTIONS.TOGGLE_LETTER_SELECTION:
            const newSelectedLetters = new Set(state.selectedLetters);
            const letterIndex = action.payload.letterIndex;
            const pressId = action.payload.pressId;
            
            if (state.lastTogglePressIds[letterIndex] === pressId) {
                return state;
            }
            
            if (newSelectedLetters.has(letterIndex)) {
                newSelectedLetters.delete(letterIndex);
            } else {
                newSelectedLetters.add(letterIndex);
            }

            const newLastTogglePressIds = { ...state.lastTogglePressIds };
            newLastTogglePressIds[letterIndex] = pressId;

            return {
                ...state,
                selectedLetters: newSelectedLetters,
                lastTogglePressIds: newLastTogglePressIds,
            };
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
        default:
            return state;
    }
}

const AppContext = createContext();

function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const randomizeAllColors = () => {
        dispatch({ type: ACTIONS.RESET });
    };

    const toggleLetterSelection = (letterIndex) => {
        dispatch({ type: ACTIONS.TOGGLE_LETTER_SELECTION, payload: { letterIndex, pressId: state.currentPressId } });
    };

    const setPressed = () => {
        dispatch({ type: ACTIONS.SET_PRESSED });
    };

    const setUnpressed = () => {
        dispatch({ type: ACTIONS.SET_UNPRESSED });
    };

    const value = {
        ...state,
        randomizeAllColors,
        toggleLetterSelection,
        setPressed,
        setUnpressed,
    };

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
    } = useAppContext();

    const isSelected = useMemo(() => selectedLetters.has(letterIndex), [selectedLetters, letterIndex]);

    const handleClick = (event) => {
        event.stopPropagation();
        toggleLetterSelection(letterIndex);
    };

    return (
        <g
            className="cursor-pointer"
            data-letter-index={letterIndex}
            onClick={handleClick}
            style={{ fill: isSelected ? 'white': "blue" }}
        >
            {children}
        </g>
    );
}

function ControlPanel() {
    const {
        randomizeAllColors,
    } = useAppContext();

    return (
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
            <h3 className="text-lg font-semibold mb-3">Color Controls</h3>

            <div className="flex flex-col gap-2">
                <button
                    onClick={randomizeAllColors}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

function AppContent() {
    const { setPressed, toggleLetterSelection, setUnpressed } = useAppContext();
    const svgRef = useRef(null);
    const lastMousePos = useRef(null);
    const isDragging = useRef(false);

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
        if (!isDragging.current || !lastMousePos.current) return;
        
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
            isDragging.current = true;
            lastMousePos.current = { x: event.clientX, y: event.clientY };
        };

        const handleMouseUp = () => {
            setUnpressed();
            isDragging.current = false;
            lastMousePos.current = null;
        };

        const handleTouchStart = (event) => {
            setPressed();
            isDragging.current = true;
            if (event.touches[0]) {
                lastMousePos.current = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            }
        };

        const handleTouchEnd = () => {
            setUnpressed();
            isDragging.current = false;
            lastMousePos.current = null;
        };

        const handleTouchMove = (event) => {
            if (!isDragging.current || !lastMousePos.current) return;
            
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
