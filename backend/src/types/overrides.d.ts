/**
 * TypeScript Declaration Overrides (TECH-002 Mitigation)
 *
 * This file contains TypeScript declaration overrides for third-party libraries.
 * Use this to fix incorrect or missing types from dependencies.
 *
 * USAGE:
 * When encountering type errors with third-party libraries:
 *
 * 1. First, check if @types/package-name exists and is up to date
 * 2. If no types exist or they're incorrect, add overrides here
 * 3. Document the reason for each override
 *
 * EXAMPLE:
 * ```typescript
 * // Override for hypothetical 'some-lib' with missing types
 * declare module 'some-lib' {
 *   export interface ProblematicInterface {
 *     correctedProperty: string; // Was missing or wrong type
 *   }
 *
 *   export function someFunction(arg: string): Promise<void>;
 * }
 * ```
 *
 * IMPORTANT:
 * - Always add a comment explaining WHY the override is needed
 * - Periodically check if upstream types have been fixed
 * - Remove overrides when no longer necessary
 */

// Add type overrides below as needed

// jstat - No @types package available on npm
// Reference: https://github.com/jstat/jstat
declare module 'jstat' {
  export const jStat: {
    beta: {
      sample(alpha: number, beta: number): number;
      pdf(x: number, alpha: number, beta: number): number;
      cdf(x: number, alpha: number, beta: number): number;
    };
    normal: {
      sample(mean: number, std: number): number;
      pdf(x: number, mean: number, std: number): number;
      cdf(x: number, mean: number, std: number): number;
    };
    studentt: {
      pdf(x: number, dof: number): number;
      cdf(x: number, dof: number): number;
      inv(p: number, dof: number): number;
    };
    mean(arr: number[]): number;
    stdev(arr: number[], flag?: boolean): number;
    variance(arr: number[], flag?: boolean): number;
    percentile(arr: number[], k: number): number;
  };
}

export {};
