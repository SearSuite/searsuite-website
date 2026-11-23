"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
export function FeatureCard({ title, description, href }) {
    const content = _jsxs(_Fragment, { children: [_jsx("h3", { children: title }), _jsx("p", { children: description })] });
    return href
        ? _jsx("a", { className: "searsuite-feature-card", "data-searsuite-component": "FeatureCard", href: href, children: content })
        : _jsx("article", { className: "searsuite-feature-card", "data-searsuite-component": "FeatureCard", children: content });
}
export function FeatureList({ items }) {
    return _jsx("div", { className: "feature-list searsuite-feature-list", "data-searsuite-component": "FeatureList", children: items.map(item => _jsx(FeatureCard, { ...item }, item.title)) });
}
