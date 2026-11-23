import type { ReactNode } from 'react';
import type { DocSection } from './types.js';
export interface ArticleProps {
    title: string;
    intro?: ReactNode;
    sections: DocSection[];
    markdown?: string;
    sourceHref?: string;
    feedback?: boolean;
}
export declare function Article({ title, intro, sections, markdown, sourceHref, feedback }: ArticleProps): import("react").JSX.Element;
