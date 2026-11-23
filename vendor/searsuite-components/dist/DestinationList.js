"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from './Link.js';
export function DestinationLink({ href, index, title, description }) {
    return _jsxs(Link, { href: href, className: "searsuite-destination-link", "data-searsuite-component": "DestinationLink", children: [_jsx("span", { className: "destination-index", children: index }), _jsxs("span", { children: [_jsx("strong", { children: title }), _jsx("small", { children: description })] }), _jsx("span", { "aria-hidden": "true", children: "\u2192" })] });
}
export function DestinationList({ items, label = 'Documentation sections' }) {
    return _jsx("nav", { className: "docs-destinations", "aria-label": label, "data-searsuite-component": "DestinationList", children: items.map(item => _jsx(DestinationLink, { ...item }, item.href)) });
}
