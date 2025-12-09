import { jStat } from 'jstat';

export interface TreatmentStats {
  successes: number;
  failures: number;
}

export interface BayesianResult {
  probBBeatsA: number; // Probability B > A
  improvement: number; // Relative improvement of B over A (mean)
  credibleIntervalA: [number, number];
  credibleIntervalB: [number, number];
}

/**
 * Compare two treatments using Beta distributions (Bayesian A/B testing).
 * Assumes a uniform prior Beta(1, 1).
 */
export const compareTreatments = (
  variantA: TreatmentStats,
  variantB: TreatmentStats
): BayesianResult => {
  // Alpha = successes + 1, Beta = failures + 1 (Uniform prior)
  const alphaA = variantA.successes + 1;
  const betaA = variantA.failures + 1;
  
  const alphaB = variantB.successes + 1;
  const betaB = variantB.failures + 1;

  // Monte Carlo simulation to estimate probability B > A
  const samples = 10000;
  let bBeatsA = 0;
  
  for (let i = 0; i < samples; i++) {
    const valA = jStat.beta.sample(alphaA, betaA);
    const valB = jStat.beta.sample(alphaB, betaB);
    if (valB > valA) bBeatsA++;
  }
  
  const probBBeatsA = bBeatsA / samples;
  
  // Calculate means
  const meanA = alphaA / (alphaA + betaA);
  const meanB = alphaB / (alphaB + betaB);
  
  const improvement = meanA > 0 ? (meanB - meanA) / meanA : 0;
  
  // Calculate 95% credible intervals using jStat inverse CDF
  // Beta distribution inverse CDF (percent point function)
  const getCredibleInterval = (alpha: number, beta: number): [number, number] => {
    return [
      jStat.beta.inv(0.025, alpha, beta),
      jStat.beta.inv(0.975, alpha, beta)
    ];
  };

  return {
    probBBeatsA,
    improvement,
    credibleIntervalA: getCredibleInterval(alphaA, betaA),
    credibleIntervalB: getCredibleInterval(alphaB, betaB)
  };
};
