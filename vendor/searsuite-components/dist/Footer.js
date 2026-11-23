"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from './Link.js';
export function Footer({ brand, links = [], extra }) {
    return (_jsxs("footer", { className: "searsuite-footer", children: [_jsx("div", { children: brand }), _jsx("nav", { "aria-label": "Footer", children: links.map(link => _jsx(Link, { href: link.href, children: link.label }, `${link.href}-${link.label}`)) }), extra] }));
}
