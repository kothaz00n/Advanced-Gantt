import { VisualFormattingSettingsModel } from '../src/settings';
import { GanttDataPoint } from '../src/visual';
import { ColorPicker } from 'powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents';
import powerbi from "powerbi-visuals-api";

// Mock ISelectionId
const createMockSelectionId = () => ({
    getSelector: jest.fn().mockReturnValue({}),
    equals: jest.fn(),
    includes: jest.fn(),
    getKey: jest.fn(),
    hasIdentity: jest.fn(),
    withMeasure: jest.fn(),
    createSelectionId: jest.fn(),
    selectorsByColumn: undefined,
    selectors: undefined
});

describe('VisualFormattingSettingsModel', () => {
    let settings: VisualFormattingSettingsModel;

    beforeEach(() => {
        settings = new VisualFormattingSettingsModel();
    });

    describe('populateColorSelector', () => {
        it('should populate slices correctly with given dataPoints', () => {
            const dataPoints: GanttDataPoint[] = [
                {
                    task: 'Task 1',
                    parent: 'Parent 1',
                    startDate: new Date(),
                    endDate: new Date(),
                    color: '#FF0000',
                    selectionId: createMockSelectionId() as any,
                    index: 0
                },
                {
                    task: 'Task 2',
                    parent: 'Parent 2',
                    startDate: new Date(),
                    endDate: new Date(),
                    color: '#00FF00',
                    selectionId: createMockSelectionId() as any,
                    index: 1
                }
            ];

            settings.populateColorSelector(dataPoints);

            expect(settings.colorSelector.slices).toHaveLength(2);
            expect(settings.colorSelector.slices[0]).toBeInstanceOf(ColorPicker);
            expect((settings.colorSelector.slices[0] as ColorPicker).displayName).toBe('Parent 1');
            expect((settings.colorSelector.slices[0] as ColorPicker).value.value).toBe('#FF0000');

            expect(settings.colorSelector.slices[1]).toBeInstanceOf(ColorPicker);
            expect((settings.colorSelector.slices[1] as ColorPicker).displayName).toBe('Parent 2');
            expect((settings.colorSelector.slices[1] as ColorPicker).value.value).toBe('#00FF00');
        });

        it('should clear existing slices before populating', () => {
             const dataPoints: GanttDataPoint[] = [
                {
                    task: 'Task 1',
                    parent: 'Parent 1',
                    startDate: new Date(),
                    endDate: new Date(),
                    color: '#FF0000',
                    selectionId: createMockSelectionId() as any,
                    index: 0
                }
            ];

            // Manually add a slice
             settings.colorSelector.slices.push(new ColorPicker({
                name: "test",
                displayName: "test",
                value: { value: "#000" }
             }));

             expect(settings.colorSelector.slices).toHaveLength(1);

             settings.populateColorSelector(dataPoints);

             expect(settings.colorSelector.slices).toHaveLength(1);
             expect((settings.colorSelector.slices[0] as ColorPicker).displayName).toBe('Parent 1');
        });

        it('should handle empty dataPoints array', () => {
            settings.populateColorSelector([]);
            expect(settings.colorSelector.slices).toHaveLength(0);
        });

         it('should handle undefined dataPoints gracefully', () => {
            settings.populateColorSelector(undefined as any);
            expect(settings.colorSelector.slices).toHaveLength(0);
        });
    });
});
