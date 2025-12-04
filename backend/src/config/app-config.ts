import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  dryRun: process.env['DRY_RUN'] !== 'false', // Default to true for safety
  requireApproval: process.env['REQUIRE_APPROVAL'] !== 'false', // Default to true
};
