// src/utils/measurePerformance.ts

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private measurements: Map<string, number[]> = new Map();
    private enabled: boolean = true;

    private constructor() { }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    /**
     * Mide el tiempo de ejecución de una función
     * @param label - Nombre descriptivo de la medición
     * @param fn - Función a medir
     * @param logToConsole - Si debe imprimir en consola (default: true)
     */
    public measure<T>(label: string, fn: () => T, logToConsole: boolean = true): T {
        if (!this.enabled) {
            return fn();
        }

        const start = performance.now();
        let result: T;
        let error: any;

        try {
            result = fn();
        } catch (e) {
            error = e;
        }

        const end = performance.now();
        const duration = end - start;
        if (!this.measurements.has(label)) {
            this.measurements.set(label, []);
        }
        this.measurements.get(label)!.push(duration);
        if (logToConsole) {
            const emoji = this.getPerformanceEmoji(duration);
            console.log(`${emoji} ${label}: ${duration.toFixed(2)}ms`);
        }
        if (error) {
            throw error;
        }

        return result!;
    }
    public async measureAsync<T>(
        label: string,
        fn: () => Promise<T>,
        logToConsole: boolean = true
    ): Promise<T> {
        if (!this.enabled) {
            return fn();
        }

        const start = performance.now();
        let result: T;
        let error: any;

        try {
            result = await fn();
        } catch (e) {
            error = e;
        }

        const end = performance.now();
        const duration = end - start;

        if (!this.measurements.has(label)) {
            this.measurements.set(label, []);
        }
        this.measurements.get(label)!.push(duration);

        if (logToConsole) {
            const emoji = this.getPerformanceEmoji(duration);
            console.log(`${emoji} ${label}: ${duration.toFixed(2)}ms`);
        }

        if (error) {
            throw error;
        }

        return result!;
    }
    public getStats(label: string): {
        count: number;
        avg: number;
        min: number;
        max: number;
        total: number;
    } | null {
        const measurements = this.measurements.get(label);
        if (!measurements || measurements.length === 0) {
            return null;
        }

        const total = measurements.reduce((sum, val) => sum + val, 0);
        const avg = total / measurements.length;
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);

        return {
            count: measurements.length,
            avg: parseFloat(avg.toFixed(2)),
            min: parseFloat(min.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    }
    public getAllStats(): Map<string, ReturnType<PerformanceMonitor['getStats']>> {
        const allStats = new Map();
        for (const [label] of this.measurements) {
            allStats.set(label, this.getStats(label));
        }
        return allStats;
    }
    public printAllStats(): void {
        console.group("📊 Performance Statistics");

        const stats = this.getAllStats();
        const sorted = Array.from(stats.entries()).sort((a, b) => {
            return (b[1]?.total || 0) - (a[1]?.total || 0);
        });

        sorted.forEach(([label, stat]) => {
            if (stat) {
                console.log(`\n🔹 ${label}`);
                console.log(`  Count: ${stat.count}`);
                console.log(`  Avg:   ${stat.avg}ms`);
                console.log(`  Min:   ${stat.min}ms`);
                console.log(`  Max:   ${stat.max}ms`);
                console.log(`  Total: ${stat.total}ms`);
            }
        });

        console.groupEnd();
    }
    public clear(): void {
        this.measurements.clear();
    }
    public clearLabel(label: string): void {
        this.measurements.delete(label);
    }
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
    private getPerformanceEmoji(duration: number): string {
        if (duration < 10) return "⚡"; // Muy rápido
        if (duration < 50) return "✅"; // Rápido
        if (duration < 100) return "⏱️"; // Aceptable
        if (duration < 300) return "⚠️"; // Lento
        return "🐌"; // Muy lento
    }
}
export const performanceMonitor = PerformanceMonitor.getInstance();
export const measure = <T>(label: string, fn: () => T, log?: boolean) => performanceMonitor.measure(label, fn, log);
export const measureAsync = <T>(label: string, fn: () => Promise<T>, log?: boolean) => performanceMonitor.measureAsync(label, fn, log);
export const getStats = (label: string) => performanceMonitor.getStats(label);
export const printAllStats = () => performanceMonitor.printAllStats();
export const clearStats = () => performanceMonitor.clear();