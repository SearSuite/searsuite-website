import type { ReactNode } from 'react';
export interface ContentNoteProps {
    title: string;
    children: ReactNode;
}
export declare function ContentNote({ title, children }: ContentNoteProps): import("react").JSX.Element;
