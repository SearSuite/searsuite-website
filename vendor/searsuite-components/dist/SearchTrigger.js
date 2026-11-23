"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Keycap } from './Keycap.js';
import { UiIcon } from './UiIcon.js';
export function SearchTrigger({ label = 'Search documentation', onClick }) {
    return _jsxs("button", { className: "searsuite-header-search", type: "button", onClick: onClick, "aria-label": label, children: [_jsx(UiIcon, { name: "search", size: 17, "aria-hidden": "true" }), _jsx("span", { children: label }), _jsx(Keycap, { children: "/" })] });
}
