import { getGroupBarPath } from './barPaths';
import { BarDatum } from '../types';

// Mock d3 scales since we don't want to rely on d3 implementation details
const mockScaleX = jest.fn();
const mockScaleY = jest.fn();

describe('getGroupBarPath', () => {
    beforeEach(() => {
        mockScaleX.mockReset();
        mockScaleY.mockReset();
    });

    test('should generate correct path for standard inputs', () => {
        // Setup mock behavior
        mockScaleX.mockImplementation((d: Date) => {
            if (d.getTime() === new Date('2023-01-01').getTime()) return 100;
            if (d.getTime() === new Date('2023-01-05').getTime()) return 500;
            return 0;
        });

        mockScaleY.mockImplementation((k: string) => {
            if (k === 'row1') return 50;
            return 0;
        });

        const mockDatum = {
            id: 'task1',
            start: new Date('2023-01-01'),
            end: new Date('2023-01-05'),
            rowKey: 'row1',
            isGroup: true,
            index: 0,
            selectionId: {} as any
        } as BarDatum;

        const taskHeight = 30;
        const barHeight = 20;

        // Calculations:
        // x1 = 100, x2 = 500, width = 400
        // yTop = 50 + (30 - 20)/2 = 55
        // topHeight = 20 * 0.5 = 10
        // tipHeight = 20 * 0.6 = 12
        // tipInset = min(400 * 0.15, 35) = min(60, 35) = 35

        // Path logic from source:
        // M${x1},${yTop} -> M100,55
        // H${x2} -> H500
        // L${x2},${yTop + topHeight + tipHeight} -> L500,77 (55+10+12)
        // L${x2 - tipInset},${yTop + topHeight} -> L465,65 (500-35, 55+10)
        // H${x1 + tipInset} -> H135 (100+35)
        // L${x1},${yTop + topHeight + tipHeight} -> L100,77
        // Z

        const expectedPath = `M100,55H500L500,77L465,65H135L100,77Z`;

        const result = getGroupBarPath(
            mockScaleX as any,
            mockScaleY as any,
            mockDatum,
            taskHeight,
            barHeight
        );

        // Remove whitespace for reliable comparison
        expect(result.replace(/\s+/g, '').trim()).toBe(expectedPath);
    });

    test('should handle narrow bars correctly (tipInset clamping)', () => {
        // Setup mock behavior for narrow bar (width 100)
        mockScaleX.mockImplementation((d: Date) => {
            if (d.getTime() === new Date('2023-01-01').getTime()) return 100;
            if (d.getTime() === new Date('2023-01-02').getTime()) return 200;
            return 0;
        });

        mockScaleY.mockReturnValue(50);

        const mockDatum = {
            id: 'task2',
            start: new Date('2023-01-01'),
            end: new Date('2023-01-02'),
            rowKey: 'row1',
            isGroup: true,
            index: 0,
            selectionId: {} as any
        } as BarDatum;

        const taskHeight = 30;
        const barHeight = 20;

        // Calculations:
        // width = 100
        // tipInset = min(100 * 0.15, 35) = min(15, 35) = 15

        // yTop = 55 (same as above)
        // topHeight = 10
        // tipHeight = 12

        // Path:
        // M100,55
        // H200
        // L200,77
        // L185,65 (200-15)
        // H115 (100+15)
        // L100,77
        // Z

        const expectedPath = `M100,55H200L200,77L185,65H115L100,77Z`;

        const result = getGroupBarPath(
            mockScaleX as any,
            mockScaleY as any,
            mockDatum,
            taskHeight,
            barHeight
        );

        expect(result.replace(/\s+/g, '').trim()).toBe(expectedPath);
    });
});
