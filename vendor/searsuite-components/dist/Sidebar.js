"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from './IconButton.js';
import { NavItem } from './NavItem.js';
import { SidebarGroup } from './SidebarGroup.js';
import { UiIcon } from './UiIcon.js';
export function Sidebar({ title, groups = [], links = [], currentHref, ariaLabel = 'Documentation navigation', open = false, onClose, onNavigate }) {
    return (_jsxs("aside", { className: `searsuite-sidebar${open ? ' searsuite-sidebar-open' : ''}`, "aria-label": ariaLabel, children: [_jsxs("div", { className: "searsuite-mobile-sidebar-head", children: [_jsx("strong", { children: title }), onClose && _jsx(IconButton, { "aria-label": "Close navigation", onClick: onClose, children: _jsx(UiIcon, { name: "close", size: 20 }) })] }), _jsxs("div", { className: "searsuite-sidebar-scroll", children: [_jsx("div", { className: "searsuite-sidebar-title", children: title }), _jsxs("nav", { "aria-label": title, children: [links.map(link => _jsx(NavItem, { link: link, current: link.href === currentHref, onNavigate: onNavigate }, `${link.href}-${link.label}`)), groups.map(group => _jsx(SidebarGroup, { group: group, currentHref: currentHref, onNavigate: onNavigate }, group.label))] })] })] }));
}
