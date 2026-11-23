import { jsx as _jsx } from "react/jsx-runtime";
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-bash.js';
const codeLanguages = { typescript: Prism.languages.extend('typescript', {}) };
Prism.languages.insertBefore('typescript', 'keyword', {
    definition: {
        pattern: /(\b(?:const|let|var|function|class|interface|type)\s+)[A-Za-z_$][\w$]*/,
        lookbehind: true,
    },
}, codeLanguages);
function renderToken(token, key) {
    if (typeof token === 'string')
        return token;
    const classes = ['token', token.type, ...(Array.isArray(token.alias) ? token.alias : token.alias ? [token.alias] : [])];
    const content = Array.isArray(token.content)
        ? token.content.map(renderToken)
        : typeof token.content === 'string' ? token.content : renderToken(token.content, 0);
    return _jsx("span", { className: classes.join(' '), children: content }, key);
}
export function CodeBlock({ code, language = 'plaintext' }) {
    const grammar = language === 'typescript' ? codeLanguages.typescript : Prism.languages[language];
    const tokens = grammar ? Prism.tokenize(code, grammar) : [code];
    return _jsx("pre", { className: "searsuite-code-block", "data-searsuite-component": "CodeBlock", children: _jsx("code", { className: `language-${language}`, children: tokens.map(renderToken) }) });
}
