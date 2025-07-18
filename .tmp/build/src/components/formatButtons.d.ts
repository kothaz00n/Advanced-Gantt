interface FormatButtonsProps {
    container: HTMLElement;
    selectedFormat: string;
    onFormatChange: (fmt: string) => void;
}
export declare function renderFormatButtons({ container, selectedFormat, onFormatChange }: FormatButtonsProps): void;
export {};
