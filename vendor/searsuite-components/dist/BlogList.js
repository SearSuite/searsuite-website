"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from './Link.js';
export function BlogEntry({ href, date, dateLabel, title, description }) {
    return _jsxs(Link, { className: "blog-list-item", href: href, "data-searsuite-component": "BlogEntry", children: [_jsx("time", { dateTime: date, children: dateLabel }), _jsxs("span", { children: [_jsx("strong", { children: title }), _jsx("small", { children: description })] }), _jsx("span", { className: "blog-list-arrow", "aria-hidden": "true", children: "\u2192" })] });
}
export function BlogList({ items, label = 'Blog posts' }) {
    return _jsx("div", { className: "blog-list", "aria-label": label, "data-searsuite-component": "BlogList", children: items.map(item => _jsx(BlogEntry, { ...item }, item.href)) });
}
