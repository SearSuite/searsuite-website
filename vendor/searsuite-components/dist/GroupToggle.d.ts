export interface GroupToggleProps {
    label: string;
    open: boolean;
    controls: string;
    onClick: () => void;
}
export declare function GroupToggle({ label, open, controls, onClick }: GroupToggleProps): import("react").JSX.Element;
