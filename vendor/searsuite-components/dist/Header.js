"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrandMark } from './BrandMark.js';
import { IconButton } from './IconButton.js';
import { Link } from './Link.js';
import { SearchTrigger } from './SearchTrigger.js';
import { UiIcon } from './UiIcon.js';
export function Header({ brand = 'SearSuite', brandHref = '/', brandMark, searchLabel = 'Search documentation', onSearch, onMenu, menuExpanded = false, navigation, }) {
    return (_jsx("header", { className: "searsuite-header", children: _jsxs("div", { className: "searsuite-header-inner", children: [_jsxs(Link, { variant: "brand", href: brandHref, children: [_jsx(BrandMark, { mark: brandMark }), _jsx("span", { children: brand })] }), onSearch && _jsx(SearchTrigger, { label: searchLabel, onClick: onSearch }), onMenu && (_jsx(IconButton, { className: "searsuite-menu-button", onClick: onMenu, "aria-label": "Open navigation", "aria-expanded": menuExpanded, children: _jsx(UiIcon, { name: "menu", size: 21, "aria-hidden": "true" }) })), navigation] }) }));
}
