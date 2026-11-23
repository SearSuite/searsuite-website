"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from './Link.js';
import { UiIcon } from './UiIcon.js';
export function BreadcrumbItem({ item }) {
    return _jsxs("span", { className: "searsuite-crumb", children: [_jsx(Link, { href: item.href, children: item.label }), _jsx(UiIcon, { name: "chevronRight", size: 14, "aria-hidden": "true" })] });
}
