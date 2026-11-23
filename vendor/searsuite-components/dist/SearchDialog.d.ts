import type { DocSection } from './types.js';
export interface SearchDialogProps {
    sections: Pick<DocSection, 'id' | 'title' | 'searchText'>[];
    onClose: () => void;
    searchLabel?: string;
}
export declare function SearchDialog({ sections, onClose, searchLabel }: SearchDialogProps): import("react").JSX.Element;
