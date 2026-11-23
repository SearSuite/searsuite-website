"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export const colorGroups = [
    { title: 'Brand / Primary', colors: [
            ['primary-50', 'Primary 50'], ['primary-100', 'Primary 100'], ['primary-200', 'Primary 200'],
            ['primary-300', 'Primary 300'], ['primary-400', 'Primary 400'], ['primary-500', 'Primary 500 · Brand'],
            ['primary-600', 'Primary 600'], ['primary-700', 'Primary 700'],
            ['primary-800', 'Primary 800'], ['primary-900', 'Primary 900'], ['primary', 'Primary alias'],
        ] },
    { title: 'Neutral', colors: [
            ['neutral-0', 'Neutral 0'], ['neutral-50', 'Neutral 50'], ['neutral-100', 'Neutral 100'],
            ['neutral-200', 'Neutral 200'], ['neutral-300', 'Neutral 300'], ['neutral-400', 'Neutral 400'],
            ['neutral-500', 'Neutral 500'], ['neutral-600', 'Neutral 600'], ['neutral-700', 'Neutral 700'],
            ['neutral-800', 'Neutral 800'], ['neutral-900', 'Neutral 900'],
        ] },
    { title: 'Status', colors: [
            ['success-50', 'Success 50'], ['success-500', 'Success 500'], ['success-700', 'Success 700'],
            ['warning-50', 'Warning 50'], ['warning-500', 'Warning 500'], ['warning-700', 'Warning 700'],
            ['danger-50', 'Danger 50'], ['danger-500', 'Danger 500'], ['danger-700', 'Danger 700'],
        ] },
    { title: 'Text roles', colors: [
            ['text-primary', 'Primary text'], ['text-secondary', 'Secondary text'], ['text-muted', 'Muted text'],
            ['text-subtle', 'Subtle text'], ['text-hint', 'Hint text'], ['text-strong', 'Strong text'],
            ['text-on-primary', 'On primary'], ['text-on-strong', 'On strong'],
        ] },
    { title: 'Surfaces and interaction', colors: [
            ['surface', 'Surface'], ['surface-strong', 'Strong surface'], ['canvas', 'Canvas'], ['hover', 'Hover'],
            ['action-hover', 'Action hover'], ['action-active', 'Action active'],
            ['border', 'Border'], ['soft-border', 'Soft border'], ['link', 'Link'],
            ['link-hover', 'Link hover'], ['focus', 'Focus'], ['selection', 'Selection'],
            ['selection-text', 'Selection text'], ['primary-fill', 'Primary fill'],
            ['success', 'Success'], ['clear', 'Transparent'], ['code-bg', 'Code background'],
        ] },
    { title: 'Syntax highlighting', colors: [
            ['syntax-keyword', 'Keyword'], ['syntax-string', 'String'], ['syntax-number', 'Number'],
            ['syntax-comment', 'Comment'], ['syntax-definition', 'Definition'], ['syntax-atom', 'Atom'],
            ['syntax-type', 'Type'], ['syntax-regexp', 'Regular expression'],
        ] },
    { title: 'Overlays and shadows', colors: [
            ['action-shadow', 'Action shadow'], ['backdrop', 'Backdrop'], ['mobile-backdrop', 'Mobile backdrop'],
            ['dialog-shadow', 'Dialog shadow'], ['mobile-shadow', 'Mobile shadow'],
            ['preview-shadow', 'Preview shadow'], ['website-shadow', 'Website shadow'],
            ['back-to-top-shadow', 'Back to top shadow'], ['toast-shadow', 'Toast shadow'],
        ] },
    { title: 'Short aliases', colors: [
            ['fg', 'Foreground'], ['muted', 'Muted'], ['tertiary', 'Tertiary'],
            ['secondary', 'Secondary'], ['strong', 'Strong'], ['hint', 'Hint'],
            ['blue', 'Blue'], ['blue-soft', 'Blue soft'], ['blue-strong', 'Blue strong'],
            ['on-accent', 'On accent'], ['on-strong', 'On strong'],
        ] },
];
export function ColorSwatch({ color, token, label, value }) {
    const tokenName = token && `--searsuite-${token}`;
    const chipRef = useRef(null);
    const [resolvedValue, setResolvedValue] = useState();
    useEffect(() => {
        if (!tokenName || value !== undefined || !chipRef.current)
            return;
        const chip = getComputedStyle(chipRef.current);
        const colorValue = chip.getPropertyValue(tokenName).trim();
        const renderedColor = chip.backgroundColor;
        setResolvedValue(colorValue.startsWith('var(') ? renderedColor : colorValue || renderedColor);
    }, [tokenName, value]);
    return _jsxs("span", { className: "searsuite-color-swatch", "data-color-token": tokenName, children: [_jsx("span", { ref: chipRef, className: "searsuite-color-swatch-chip", style: { backgroundColor: color ?? (tokenName ? `var(${tokenName})` : undefined) }, "aria-hidden": "true" }), _jsxs("span", { className: "searsuite-color-swatch-details", children: [_jsx("span", { className: "searsuite-color-swatch-label", children: label }), tokenName && _jsx("code", { children: tokenName }), _jsx("code", { className: "searsuite-color-swatch-value", children: value ?? resolvedValue ?? (!tokenName ? color : '') })] })] });
}
