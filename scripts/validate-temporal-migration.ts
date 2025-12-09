import { temporalMultiplier } from '../backend/src/workers/temporal-multiplier.js';
import { getTemporalContext as getNewContext } from '../backend/src/analysis/temporal-intelligence.js';

const runValidation = () => {
  console.log('Validating Temporal Intelligence Migration...');
  
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const samples = 1000;
  
  let agreements = 0;
  let maxDelta = 0;
  
  for (let i = 0; i < samples; i++) {
    const time = now - Math.random() * weekMs;
    const date = new Date(time);
    
    const legacy = temporalMultiplier.getContext(date);
    const newCtx = getNewContext(date);
    
    const legacyMult = legacy.multiplier;
    const newMult = newCtx.monitoringMultiplier || 1.0;
    
    const delta = Math.abs(legacyMult - newMult);
    if (delta > maxDelta) maxDelta = delta;
    
    if (delta < 0.1) agreements++;
  }
  
  console.log(`Checked ${samples} samples across the last week.`);
  console.log(`Agreement Rate: ${(agreements / samples * 100).toFixed(2)}%`);
  console.log(`Max Delta: ${maxDelta.toFixed(3)}`);
  
  if (agreements / samples < 0.8) {
      console.warn('WARNING: Agreement rate below 80%. Migration rules may need tuning.');
      process.exit(1);
  } else {
      console.log('SUCCESS: Agreement rate acceptable for migration.');
  }
};

runValidation();
