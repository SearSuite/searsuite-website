"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BreadcrumbItem } from './BreadcrumbItem.js';
import { IconButton } from './IconButton.js';
import { UiIcon } from './UiIcon.js';
export function Breadcrumbs({ items, current, onToggleSidebar, sidebarCollapsed = false }) {
    return (_jsx("div", { className: "searsuite-subbar", children: _jsxs("div", { className: "searsuite-subbar-inner", children: [onToggleSidebar && (_jsx(IconButton, { className: "searsuite-sidebar-toggle", onClick: onToggleSidebar, "aria-label": sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar', title: sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar', children: _jsx(UiIcon, { name: sidebarCollapsed ? 'panelLeftOpen' : 'panelLeftClose', size: 18 }) })), _jsxs("nav", { className: "searsuite-breadcrumbs", "aria-label": "Breadcrumb", children: [items.map(item => _jsx(BreadcrumbItem, { item: item }, `${item.href}-${item.label}`)), _jsx("span", { className: "searsuite-crumb-current", "aria-current": "page", children: current })] })] }) }));
}
