"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { IconButton } from './IconButton.js';
import { Link } from './Link.js';
import { UiIcon } from './UiIcon.js';
export function SearchDialog({ sections, onClose, searchLabel = 'Search documentation' }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    const results = sections.filter(section => `${section.title} ${section.searchText ?? ''}`.toLowerCase().includes(query.toLowerCase().trim()));
    return _jsx("div", { className: "searsuite-search-backdrop", role: "presentation", onMouseDown: event => { if (event.target === event.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "searsuite-search-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Search documentation", children: [_jsxs("div", { className: "searsuite-search-field", children: [_jsx(UiIcon, { name: "search", size: 19, "aria-hidden": "true" }), _jsx("input", { ref: inputRef, type: "search", value: query, onChange: event => setQuery(event.target.value), onKeyDown: event => { if (event.key === 'Enter' && results[0]) {
                                window.location.hash = results[0].id;
                                onClose();
                            } }, placeholder: searchLabel, "aria-label": "Search documentation" }), _jsx(IconButton, { onClick: onClose, "aria-label": "Close search", children: _jsx(UiIcon, { name: "close", size: 19 }) })] }), _jsx("div", { className: "searsuite-search-results", children: results.length ? results.map(section => _jsxs(Link, { variant: "search", href: `#${section.id}`, onClick: onClose, children: [section.title, _jsx(UiIcon, { name: "chevronRight", size: 16, "aria-hidden": "true" })] }, section.id)) : _jsx("p", { children: "No results in this article" }) }), _jsx("div", { className: "searsuite-search-hint", children: "Search this article" })] }) });
}
