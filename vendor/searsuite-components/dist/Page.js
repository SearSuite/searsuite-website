"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Article } from './Article.js';
import { Breadcrumbs } from './Breadcrumbs.js';
import { Footer } from './Footer.js';
import { Header } from './Header.js';
import { SearchDialog } from './SearchDialog.js';
import { Sidebar } from './Sidebar.js';
import { SkipLink } from './SkipLink.js';
import { TableOfContents } from './TableOfContents.js';
export function Page({ brand, brandHref, brandMark, breadcrumbs = [], sidebarTitle, navigation, searchLabel, tocHeading, footer, footerLinks, title, intro, sections, markdown, sourceHref, feedback, }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const searchButtonRef = useRef(null);
    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === 'Escape') {
                setSearchOpen(false);
                setMenuOpen(false);
            }
            const target = event.target;
            const editable = target?.matches('input, textarea, [contenteditable="true"]');
            if ((event.key === '/' && !editable) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
                event.preventDefault();
                searchButtonRef.current = target;
                setSearchOpen(true);
            }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);
    function openSearch() {
        searchButtonRef.current = document.activeElement;
        setSearchOpen(true);
    }
    function closeSearch() {
        setSearchOpen(false);
        searchButtonRef.current?.focus();
    }
    return (_jsxs("div", { className: `searsuite${sidebarCollapsed ? ' searsuite-collapsed' : ''}`, children: [_jsx(SkipLink, { href: "#searsuite-main" }), _jsx(Header, { brand: brand, brandHref: brandHref, brandMark: brandMark, searchLabel: searchLabel, onSearch: openSearch, onMenu: () => setMenuOpen(true), menuExpanded: menuOpen }), _jsx(Breadcrumbs, { items: breadcrumbs, current: title, onToggleSidebar: () => setSidebarCollapsed(value => !value), sidebarCollapsed: sidebarCollapsed }), _jsxs("div", { className: "searsuite-shell", children: [_jsx(Sidebar, { title: sidebarTitle, groups: navigation, open: menuOpen, onClose: () => setMenuOpen(false), onNavigate: () => setMenuOpen(false) }), _jsx("main", { className: "searsuite-main", id: "searsuite-main", children: _jsxs("div", { className: "searsuite-article-layout", children: [_jsx(Article, { title: title, intro: intro, sections: sections, markdown: markdown, sourceHref: sourceHref, feedback: feedback }), _jsx(TableOfContents, { sections: sections, heading: tocHeading })] }) })] }), _jsx(Footer, { brand: footer, links: footerLinks }), menuOpen && _jsx("button", { className: "searsuite-mobile-scrim", type: "button", "aria-label": "Close navigation", onClick: () => setMenuOpen(false) }), searchOpen && _jsx(SearchDialog, { sections: sections, searchLabel: searchLabel, onClose: closeSearch })] }));
}
