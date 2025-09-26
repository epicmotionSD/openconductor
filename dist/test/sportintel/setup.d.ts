/**
 * SportIntel Test Setup
 *
 * Configures Jest testing environment for SportIntel components
 * Extends OpenConductor test utilities with sports analytics specific setup
 */
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
export declare class SportIntelTestUtils {
    private static testDatabase;
    private static testRedis;
    static setupTestEnvironment(): Promise<void>;
    static teardownTestEnvironment(): Promise<void>;
    static createMockPlayerData(overrides?: Partial<any>): any;
    static createMockGameData(overrides?: Partial<any>): any;
    static createMockPredictionData(overrides?: Partial<any>): any;
    static createMockPortfolioData(overrides?: Partial<any>): any;
    static createMockAlertData(overrides?: Partial<any>): any;
    static waitFor(condition: () => boolean, timeout?: number): Promise<void>;
    static mockTimestamp(timestamp: string): jest.SpyInstance;
    static mockEnvironment(env: 'development' | 'testing' | 'production'): jest.SpyInstance;
    static createMockEventBusMessage(type: string, payload?: any): any;
    static createMockWebSocketMessage(type: string, data?: any): any;
    static flushPromises(): Promise<void>;
    static expectToThrowAsync: (fn: () => Promise<any>, expectedError?: string | RegExp) => Promise<void>;
    static mockApiResponse(data: any, status?: number): any;
    static mockApiError(message: string, status?: number): any;
    static generateRandomString(length?: number): string;
    static generateRandomNumber(min?: number, max?: number): number;
    static deepClone<T>(obj: T): T;
}
export declare const testConfig: SportIntelConfigManager;
export { SportIntelConfigManager };
export default SportIntelTestUtils;
//# sourceMappingURL=setup.d.ts.map