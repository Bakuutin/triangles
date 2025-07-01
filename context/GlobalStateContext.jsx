import React, { createContext, useContext, useReducer } from "react";

// Global State Context
const GlobalStateContext = createContext();
const GlobalDispatchContext = createContext();

// Initial state
export const initialState = {
    letterColors: {}, // Map of letter index to color index
    globalColorIndex: 0, // Global color index for all letters
    colorMode: "individual", // 'individual' or 'global'
    colors: [
        "#ef4444", // Red
        "#3b82f6", // Blue
        "#10b981", // Green
    ],
};

// Action types
export const ACTIONS = {
    SET_LETTER_COLOR: "SET_LETTER_COLOR",
    SET_GLOBAL_COLOR: "SET_GLOBAL_COLOR",
    SET_COLOR_MODE: "SET_COLOR_MODE",
    RESET_ALL_COLORS: "RESET_ALL_COLORS",
    RANDOMIZE_ALL_COLORS: "RANDOMIZE_ALL_COLORS",
    UPDATE_COLOR: "UPDATE_COLOR",
    RESET_COLORS_TO_DEFAULT: "RESET_COLORS_TO_DEFAULT",
    ADD_COLOR: "ADD_COLOR",
    REMOVE_COLOR: "REMOVE_COLOR",
    SET_PALETTE_SIZE: "SET_PALETTE_SIZE",
};

// Reducer function
function globalReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_LETTER_COLOR:
            return {
                ...state,
                letterColors: {
                    ...state.letterColors,
                    [action.payload.letterIndex]: action.payload.colorIndex,
                },
            };
        case ACTIONS.SET_GLOBAL_COLOR:
            return {
                ...state,
                globalColorIndex: action.payload,
            };
        case ACTIONS.SET_COLOR_MODE:
            return {
                ...state,
                colorMode: action.payload,
            };
        case ACTIONS.RESET_ALL_COLORS:
            return {
                ...state,
                letterColors: {},
                globalColorIndex: 0,
            };
        case ACTIONS.RANDOMIZE_ALL_COLORS:
            const newLetterColors = {};
            // We'll need to import shapes here, but for now we'll handle this in the component
            return {
                ...state,
                letterColors: newLetterColors,
            };
        case ACTIONS.UPDATE_COLOR:
            const updatedColors = [...state.colors];
            updatedColors[action.payload.index] = action.payload.color;
            return {
                ...state,
                colors: updatedColors,
            };
        case ACTIONS.RESET_COLORS_TO_DEFAULT:
            return {
                ...state,
                colors: ["#ef4444", "#3b82f6", "#10b981"],
            };
        case ACTIONS.ADD_COLOR:
            const newColors = [...state.colors];
            newColors.push(action.payload || "#000000");
            return {
                ...state,
                colors: newColors,
            };
        case ACTIONS.REMOVE_COLOR:
            if (state.colors.length > 1) {
                const colorsAfterRemoval = state.colors.filter((_, index) =>
                    index !== action.payload
                );
                // Adjust global color index if it's now out of bounds
                const newGlobalIndex =
                    state.globalColorIndex >= colorsAfterRemoval.length
                        ? colorsAfterRemoval.length - 1
                        : state.globalColorIndex;
                return {
                    ...state,
                    colors: colorsAfterRemoval,
                    globalColorIndex: newGlobalIndex,
                };
            }
            return state;
        case ACTIONS.SET_PALETTE_SIZE:
            const targetSize = Math.max(1, Math.min(20, action.payload)); // Limit between 1-20
            let adjustedColors = [...state.colors];

            if (targetSize > adjustedColors.length) {
                // Add colors
                while (adjustedColors.length < targetSize) {
                    adjustedColors.push("#000000");
                }
            } else if (targetSize < adjustedColors.length) {
                // Remove colors
                adjustedColors = adjustedColors.slice(0, targetSize);
            }

            // Adjust global color index if needed
            const adjustedGlobalIndex =
                state.globalColorIndex >= adjustedColors.length
                    ? adjustedColors.length - 1
                    : state.globalColorIndex;

            return {
                ...state,
                colors: adjustedColors,
                globalColorIndex: adjustedGlobalIndex,
            };
        default:
            return state;
    }
}

// Global State Provider Component
export function GlobalStateProvider({ children }) {
    const [state, dispatch] = useReducer(globalReducer, initialState);

    return (
        <GlobalStateContext.Provider value={state}>
            <GlobalDispatchContext.Provider value={dispatch}>
                {children}
            </GlobalDispatchContext.Provider>
        </GlobalStateContext.Provider>
    );
}

// Custom hooks for using the global state
export function useGlobalState() {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error(
            "useGlobalState must be used within a GlobalStateProvider",
        );
    }
    return context;
}

export function useGlobalDispatch() {
    const context = useContext(GlobalDispatchContext);
    if (context === undefined) {
        throw new Error(
            "useGlobalDispatch must be used within a GlobalStateProvider",
        );
    }
    return context;
} 