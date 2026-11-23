import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-bash.js';
export interface CodeBlockProps {
    code: string;
    language?: 'typescript' | 'bash' | 'plaintext';
}
export declare function CodeBlock({ code, language }: CodeBlockProps): import("react").JSX.Element;
