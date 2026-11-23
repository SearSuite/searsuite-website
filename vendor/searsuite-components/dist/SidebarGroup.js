"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { GroupToggle } from './GroupToggle.js';
import { NavItem } from './NavItem.js';
export function SidebarGroup({ group, currentHref, onNavigate }) {
    const [open, setOpen] = useState(group.defaultOpen ?? true);
    const regionId = useId();
    return (_jsxs("div", { className: "searsuite-sidebar-group", children: [_jsx(GroupToggle, { label: group.label, open: open, controls: regionId, onClick: () => setOpen(value => !value) }), _jsx("div", { className: "searsuite-group-links", id: regionId, hidden: !open, children: group.links.map(link => _jsx(NavItem, { link: link, current: link.href === currentHref, onNavigate: onNavigate }, `${link.href}-${link.label}`)) })] }));
}
