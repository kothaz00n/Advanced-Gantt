interface ParentToggleButtonsProps {
    container: HTMLElement;
    allExpanded: boolean;
    onChange: (expand: boolean) => void;
}
export declare function renderParentToggleButtons({ container, allExpanded, onChange }: ParentToggleButtonsProps): void;
export {};
