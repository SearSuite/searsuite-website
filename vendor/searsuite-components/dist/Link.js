"use client";
import { jsx as _jsx } from "react/jsx-runtime";
export function Link({ variant = 'default', className = '', ...props }) {
    const variantClass = {
        default: '',
        brand: 'searsuite-brand',
        source: 'searsuite-source-link',
        sidebar: 'searsuite-nav-link',
        toc: 'searsuite-toc-link',
        search: 'searsuite-search-result',
    }[variant];
    return _jsx("a", { ...props, className: [variantClass, className].filter(Boolean).join(' ') || undefined });
}
