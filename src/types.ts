import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;

export interface BarDatum {
  id: string;
  start: Date;
  end: Date;
  rowKey: string;
  isGroup: boolean;
  index: number;
  completion?: number;
  secondaryStart?: Date;
  secondaryEnd?: Date;
  selectionId: ISelectionId;
  legend?: string;
  gradientId?: string;
}
