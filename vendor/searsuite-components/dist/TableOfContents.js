"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { TocLink } from './TocLink.js';
export function TableOfContents({ sections, heading = 'In this article' }) {
    const visibleSections = sections.filter(section => section.inTableOfContents !== false);
    const visibleIds = visibleSections.flatMap(section => [section.id, ...(section.subsections ?? []).map(child => child.id)]);
    const [active, setActive] = useState(visibleSections[0]?.id ?? '');
    useEffect(() => {
        const ids = new Set(visibleIds);
        const update = () => {
            const hash = decodeURIComponent(window.location.hash.slice(1));
            if (ids.has(hash))
                setActive(hash);
        };
        update();
        window.addEventListener('hashchange', update);
        if (visibleSections.some(section => section.subsections?.length)) {
            const headings = visibleIds.map(id => document.getElementById(id)).filter((element) => !!element);
            const updateFromScroll = () => {
                const headerHeight = document.querySelector('.searsuite-header')?.getBoundingClientRect().height ?? 72;
                let current = headings[0];
                for (const element of headings) {
                    const scrollMargin = parseFloat(getComputedStyle(element).scrollMarginTop);
                    const activationLine = scrollMargin > 0 ? scrollMargin : headerHeight + 30;
                    if (element.getBoundingClientRect().top > activationLine + 1)
                        break;
                    current = element;
                }
                if (current)
                    setActive(current.id);
            };
            updateFromScroll();
            window.addEventListener('scroll', updateFromScroll, { passive: true });
            return () => { window.removeEventListener('scroll', updateFromScroll); window.removeEventListener('hashchange', update); };
        }
        if (typeof IntersectionObserver === 'undefined')
            return () => window.removeEventListener('hashchange', update);
        const observer = new IntersectionObserver(entries => {
            const first = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (first)
                setActive(first.target.id);
        }, { rootMargin: '-150px 0px -60% 0px' });
        visibleIds.forEach(id => {
            const element = document.getElementById(id);
            if (element)
                observer.observe(element);
        });
        return () => { observer.disconnect(); window.removeEventListener('hashchange', update); };
    }, [sections]);
    return (_jsx("aside", { className: "searsuite-toc", "aria-label": heading, children: _jsxs("div", { className: "searsuite-toc-inner", children: [_jsx("h2", { children: heading }), _jsx("nav", { children: visibleSections.map(section => _jsxs("div", { className: "searsuite-toc-group", children: [_jsx(TocLink, { id: section.id, title: section.title, active: active === section.id }), !!section.subsections?.length && _jsx("div", { className: "searsuite-toc-subsections", children: section.subsections.map(child => _jsx(TocLink, { id: child.id, title: child.title, active: active === child.id }, child.id)) })] }, section.id)) })] }) }));
}
