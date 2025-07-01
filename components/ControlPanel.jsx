import React from "react";
import { useGlobalState, useGlobalDispatch, ACTIONS } from "../context/GlobalStateContext.jsx";
import { shapes } from "../shapes.js";

export function ControlPanel() {
    const { colorMode, globalColorIndex, colors } = useGlobalState();
    const dispatch = useGlobalDispatch();

    const handleModeChange = (mode) => {
        dispatch({ type: ACTIONS.SET_COLOR_MODE, payload: mode });
    };

    const handleGlobalColorChange = (colorIndex) => {
        dispatch({ type: ACTIONS.SET_GLOBAL_COLOR, payload: colorIndex });
    };

    const handleReset = () => {
        dispatch({ type: ACTIONS.RESET_ALL_COLORS });
    };

    const handleRandomize = () => {
        const newLetterColors = {};
        for (let i = 0; i < shapes.length; i++) {
            newLetterColors[i] = Math.floor(Math.random() * colors.length);
        }
        dispatch({ type: ACTIONS.RANDOMIZE_ALL_COLORS, payload: newLetterColors });
    };

    const handleColorChange = (index, color) => {
        dispatch({
            type: ACTIONS.UPDATE_COLOR,
            payload: { index, color },
        });
    };

    const handleResetColors = () => {
        dispatch({ type: ACTIONS.RESET_COLORS_TO_DEFAULT });
    };

    const handleAddColor = () => {
        dispatch({ type: ACTIONS.ADD_COLOR });
    };

    const handleRemoveColor = (index) => {
        dispatch({ type: ACTIONS.REMOVE_COLOR, payload: index });
    };

    const handleSetPaletteSize = (size) => {
        dispatch({ type: ACTIONS.SET_PALETTE_SIZE, payload: size });
    };

    return (
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white min-w-64">
            <h2 className="text-lg font-bold mb-4">Color Controls</h2>
            
            {/* Mode Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Color Mode:</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleModeChange("individual")}
                        className={`px-3 py-1 rounded text-sm ${
                            colorMode === "individual"
                                ? "bg-blue-500"
                                : "bg-gray-600 hover:bg-gray-500"
                        }`}
                    >
                        Individual
                    </button>
                    <button
                        onClick={() => handleModeChange("global")}
                        className={`px-3 py-1 rounded text-sm ${
                            colorMode === "global"
                                ? "bg-blue-500"
                                : "bg-gray-600 hover:bg-gray-500"
                        }`}
                    >
                        Global
                    </button>
                </div>
            </div>

            {/* Global Color Control */}
            {colorMode === "global" && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Global Color: {globalColorIndex + 1}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max={colors.length - 1}
                        value={globalColorIndex}
                        onChange={(e) => handleGlobalColorChange(parseInt(e.target.value))}
                        className="w-full"
                    />
                </div>
            )}

            {/* Color Palette */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Color Palette:</label>
                    <div className="flex gap-1">
                        <button
                            onClick={handleAddColor}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 rounded text-xs"
                        >
                            +
                        </button>
                        <button
                            onClick={handleResetColors}
                            className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 rounded text-xs"
                        >
                            Reset
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {colors.map((color, index) => (
                        <div key={index} className="relative">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => handleColorChange(index, e.target.value)}
                                className="w-full h-8 rounded cursor-pointer"
                            />
                            {colors.length > 1 && (
                                <button
                                    onClick={() => handleRemoveColor(index)}
                                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Palette Size Control */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Palette Size: {colors.length}
                </label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={colors.length}
                    onChange={(e) => handleSetPaletteSize(parseInt(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleReset}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                >
                    Reset All
                </button>
                <button
                    onClick={handleRandomize}
                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded text-sm"
                >
                    Randomize
                </button>
            </div>
        </div>
    );
} 