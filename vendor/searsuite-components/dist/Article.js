"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CopyButton } from './CopyButton.js';
import { Feedback } from './Feedback.js';
import { Section } from './Section.js';
import { SourceLink } from './SourceLink.js';
export function Article({ title, intro, sections, markdown, sourceHref, feedback = false }) {
    return (_jsxs("article", { className: "searsuite-article", children: [_jsxs("header", { className: "searsuite-article-header", children: [_jsx("h1", { children: title }), intro && _jsx("div", { className: "searsuite-lead", children: intro }), (markdown || sourceHref) && (_jsxs("div", { className: "searsuite-article-actions", children: [markdown && _jsx(CopyButton, { markdown: markdown }), sourceHref && _jsx(SourceLink, { href: sourceHref })] }))] }), _jsx("div", { className: "searsuite-article-body", children: sections.map(section => _jsx(Section, { id: section.id, title: section.title, children: section.content }, section.id)) }), feedback && _jsx(Feedback, {})] }));
}
