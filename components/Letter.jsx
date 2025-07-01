import React from "react";
import { useGlobalState, useGlobalDispatch, ACTIONS } from "../context/GlobalStateContext.jsx";

export function Letter({ shapes, letterIndex }) {
    const { letterColors, globalColorIndex, colorMode, colors } = useGlobalState();
    const dispatch = useGlobalDispatch();

    // Determine the current color based on mode
    const getCurrentColorIndex = () => {
        if (colorMode === "global") {
            return globalColorIndex;
        }
        return letterColors[letterIndex] || 0;
    };

    const currentColorIndex = getCurrentColorIndex();

    const handleClick = () => {
        if (colorMode === "global") {
            // Cycle through global colors
            const nextColorIndex = (globalColorIndex + 1) % colors.length;
            dispatch({
                type: ACTIONS.SET_GLOBAL_COLOR,
                payload: nextColorIndex,
            });
        } else {
            // Cycle through individual colors for this letter
            const currentIndex = letterColors[letterIndex] || 0;
            const nextColorIndex = (currentIndex + 1) % colors.length;
            dispatch({
                type: ACTIONS.SET_LETTER_COLOR,
                payload: {
                    letterIndex,
                    colorIndex: nextColorIndex,
                },
            });
        }
    };

    return (
        <g onClick={handleClick} style={{ cursor: "pointer" }}>
            {React.cloneElement(shapes, {
                fill: colors[currentColorIndex],
                stroke: "#000",
                strokeWidth: "2",
            })}
        </g>
    );
} 