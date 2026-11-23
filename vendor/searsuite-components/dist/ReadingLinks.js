"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from './Link.js';
export function ReadingLinks({ items, label = 'Continue reading' }) {
    return _jsx("nav", { className: "quickstart-links", "aria-label": label, "data-searsuite-component": "ReadingLinks", children: items.map(item => _jsxs(Link, { href: item.href, children: [item.label, " ", _jsx("span", { "aria-hidden": "true", children: "\u2192" })] }, item.href)) });
}
