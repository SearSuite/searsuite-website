import type { DocSection } from './types.js';
export interface TableOfContentsProps {
    sections: Pick<DocSection, 'id' | 'title' | 'inTableOfContents' | 'subsections'>[];
    heading?: string;
}
export declare function TableOfContents({ sections, heading }: TableOfContentsProps): import("react").JSX.Element;
