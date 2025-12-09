import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalIntelligence } from '../../src/analysis/temporal-intelligence.js';
import type { TemporalExperiment } from '../../src/config/temporal-schema.js';

describe('Temporal Experiments', () => {
    let ti: TemporalIntelligence;
    
    beforeEach(() => {
        ti = new TemporalIntelligence();
        // Clear env var to avoid interference
        delete process.env.TEMPORAL_EXPERIMENT_ID;
    });

    it('should assign users to experiment variants when traffic is 100%', () => {
        const experiment: TemporalExperiment = {
            id: 'exp-1',
            name: 'Test Experiment',
            status: 'running',
            variants: [
                { id: 'control', name: 'Control', ruleOverrides: {} },
                { id: 'treatment', name: 'Treatment', ruleOverrides: {} }
            ],
            trafficAllocation: 1.0, // 100% traffic
            startDate: new Date().toISOString()
        };
        
        ti.setConfig([], [], [experiment]);
        
        // Mock time to get context
        const context1 = ti.getTemporalContext(new Date('2025-01-01T10:00:00Z'));
        
        expect(context1.experimentId).toBe('exp-1');
        expect(['control', 'treatment']).toContain(context1.variant);
    });
    
    it('should respect traffic allocation of 0%', () => {
        const experiment: TemporalExperiment = {
            id: 'exp-low',
            name: 'Low Traffic',
            status: 'running',
            variants: [{ id: 'A', name:'A', ruleOverrides:{} }, { id: 'B', name:'B', ruleOverrides:{} }],
            trafficAllocation: 0.0, // 0% traffic
            startDate: new Date().toISOString()
        };
        
        ti.setConfig([], [], [experiment]);
        const context = ti.getTemporalContext(new Date());
        
        expect(context.experimentId).toBeUndefined();
    });

    it('should ignore non-running experiments', () => {
        const experiment: TemporalExperiment = {
            id: 'exp-draft',
            name: 'Draft Experiment',
            status: 'draft',
            variants: [{ id: 'A', name:'A', ruleOverrides:{} }, { id: 'B', name:'B', ruleOverrides:{} }],
            trafficAllocation: 1.0,
            startDate: new Date().toISOString()
        };
        
        ti.setConfig([], [], [experiment]);
        const context = ti.getTemporalContext(new Date());
        
        expect(context.experimentId).toBeUndefined();
    });
});
