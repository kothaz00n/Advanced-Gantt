import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
export declare class BarStyleSlice extends formattingSettings.SimpleSlice {
    name: string;
    displayName: string;
    selector: powerbi.data.Selector | undefined;
    fill: formattingSettings.ColorPicker;
}
export declare class BarStyleCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    slices: formattingSettings.SimpleSlice[];
}
export declare class BarStyleSettingsModel extends formattingSettings.Model {
    barStyleCard: BarStyleCard;
    cards: BarStyleCard[];
}
