export declare class PerformanceMonitor {
    private static instance;
    private measurements;
    private enabled;
    private constructor();
    static getInstance(): PerformanceMonitor;
    /**
     * Mide el tiempo de ejecución de una función
     * @param label - Nombre descriptivo de la medición
     * @param fn - Función a medir
     * @param logToConsole - Si debe imprimir en consola (default: true)
     */
    measure<T>(label: string, fn: () => T, logToConsole?: boolean): T;
    measureAsync<T>(label: string, fn: () => Promise<T>, logToConsole?: boolean): Promise<T>;
    getStats(label: string): {
        count: number;
        avg: number;
        min: number;
        max: number;
        total: number;
    } | null;
    getAllStats(): Map<string, ReturnType<PerformanceMonitor['getStats']>>;
    printAllStats(): void;
    clear(): void;
    clearLabel(label: string): void;
    setEnabled(enabled: boolean): void;
    private getPerformanceEmoji;
}
export declare const performanceMonitor: PerformanceMonitor;
export declare const measure: <T>(label: string, fn: () => T, log?: boolean) => T;
export declare const measureAsync: <T>(label: string, fn: () => Promise<T>, log?: boolean) => Promise<T>;
export declare const getStats: (label: string) => {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
};
export declare const printAllStats: () => void;
export declare const clearStats: () => void;
