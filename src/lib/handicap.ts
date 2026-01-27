/**
 * Handicap Calculation System
 * 
 * GSI (Group Skill Index): Evolves within each group based on match history
 * - Starts at user's PHI when joining a group
 * - Moves conservatively: ~0.5-1.0 strokes per match early on
 * - Uses adaptive learning rate: alpha = 1 / (n + 3) for stability
 * - Capped at ±2 strokes per match adjustment
 * 
 * Course Handicap: Adjusts GSI for course difficulty
 * - Formula: (GSI × Slope / 113) + (Course Rating - Par)
 * - This gives strokes relative to par for that specific course
 * 
 * Match Strokes: Relative handicap between players/teams
 * - Best player/team gets 0 strokes
 * - Others get the difference rounded to nearest integer
 */

/**
 * Calculate course handicap from GSI
 * @param gsi Group Skill Index (or PHI if no GSI)
 * @param slopeRating Course slope rating (typically 55-155, standard 113)
 * @param courseRating Course rating (expected score for scratch golfer)
 * @param par Course par
 * @returns Course handicap (strokes over par expected)
 */
export const calculateCourseHandicap = (
  gsi: number,
  slopeRating: number,
  courseRating: number,
  par: number
): number => {
  // Standard USGA formula: Course Handicap = Handicap Index × (Slope / 113) + (CR - Par)
  const courseHandicap = (gsi * slopeRating / 113) + (courseRating - par);
  return Math.round(courseHandicap * 10) / 10;
};

/**
 * Calculate course handicap for partial rounds
 * @param fullCourseHandicap Course handicap for 18 holes
 * @param holesPlayed Number of holes being played
 * @returns Adjusted course handicap
 */
export const calculatePartialHandicap = (
  fullCourseHandicap: number,
  holesPlayed: number
): number => {
  return Math.round((fullCourseHandicap * holesPlayed / 18) * 10) / 10;
};

/**
 * Calculate team handicap for scramble format
 * 1-person: 50% (solo player can't pick from multiple shots)
 * 2-person scramble: 35% low + 15% high
 * 4-person scramble: 20% A + 15% B + 10% C + 5% D
 */
export const calculateScrambleHandicap = (handicaps: number[]): number => {
  if (handicaps.length === 0) return 0;
  
  const sorted = [...handicaps].sort((a, b) => a - b);
  
  if (sorted.length === 1) {
    // Solo player gets 50% of their handicap
    return Math.round(sorted[0] * 0.50 * 10) / 10;
  } else if (sorted.length === 2) {
    return Math.round((sorted[0] * 0.35 + sorted[1] * 0.15) * 10) / 10;
  } else if (sorted.length === 4) {
    return Math.round(
      (sorted[0] * 0.20 + sorted[1] * 0.15 + sorted[2] * 0.10 + sorted[3] * 0.05) * 10
    ) / 10;
  }
  
  // Default: average
  return Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 10) / 10;
};

/**
 * Calculate team handicap for best ball format
 * 1-person: 100% (uses full handicap)
 * 2-person: 80% low + 20% high
 * 4-person: 80% A + 60% B + 40% C + 20% D
 */
export const calculateBestBallHandicap = (handicaps: number[]): number => {
  if (handicaps.length === 0) return 0;
  
  const sorted = [...handicaps].sort((a, b) => a - b);
  
  if (sorted.length === 1) {
    // Solo player uses 100% of their handicap
    return sorted[0];
  } else if (sorted.length === 2) {
    return Math.round((sorted[0] * 0.80 + sorted[1] * 0.20) * 10) / 10;
  } else if (sorted.length === 4) {
    return Math.round(
      (sorted[0] * 0.80 + sorted[1] * 0.60 + sorted[2] * 0.40 + sorted[3] * 0.20) * 10
    ) / 10;
  }
  
  // Default: just use lowest
  return sorted[0];
};

/**
 * Calculate team handicap for match play format
 * 1-person: 100% of their handicap
 * 2-person: Average of both players' handicaps
 */
export const calculateMatchPlayHandicap = (handicaps: number[]): number => {
  if (handicaps.length === 0) return 0;
  if (handicaps.length === 1) return handicaps[0];
  
  // Average for team match play
  const sum = handicaps.reduce((a, b) => a + b, 0);
  return Math.round((sum / handicaps.length) * 10) / 10;
};

/**
 * Calculate relative match strokes between teams
 * @param teamHandicaps Array of team course handicaps
 * @returns Array of strokes for each team (best team gets 0)
 */
export const calculateMatchStrokes = (teamHandicaps: number[]): number[] => {
  const minHandicap = Math.min(...teamHandicaps);
  return teamHandicaps.map(h => Math.round(h - minHandicap));
};

/**
 * Calculate GSI adjustment after a match
 * Uses AGGRESSIVE learning rate so matches matter more than initial PHI
 * 
 * The system learns fast early on, then stabilizes:
 * - Match 1: ~60% weight on new data
 * - Match 3: ~40% weight  
 * - Match 5: ~30% weight
 * - Match 10: ~18% weight
 * 
 * @param currentGsi Current GSI
 * @param matchesPlayed Number of completed matches in this group (before this one)
 * @param scoreDifferential How many strokes the player was off from expected (positive = worse than expected)
 * @param holesPlayed Number of holes played (affects weight)
 * @returns New GSI value
 */
export const calculateGsiAdjustment = (
  currentGsi: number,
  matchesPlayed: number,
  scoreDifferential: number,
  holesPlayed: number = 18
): number => {
  // Aggressive learning rate: alpha = 1 / (n + 1.5)
  // n=0: 0.67, n=1: 0.40, n=3: 0.22, n=5: 0.15, n=10: 0.09
  // This makes early matches count A LOT so PHI quickly becomes irrelevant
  const alpha = 1 / (matchesPlayed + 1.5);
  
  // Partial round weight (9 holes = 50% weight)
  const roundWeight = holesPlayed / 18;
  
  // Calculate adjustment (capped at ±3 strokes per match for faster convergence)
  const rawAdjustment = scoreDifferential * alpha * roundWeight;
  const cappedAdjustment = Math.max(-3, Math.min(3, rawAdjustment));
  
  // Apply adjustment
  const newGsi = currentGsi + cappedAdjustment;
  
  // Clamp GSI to reasonable range (-10 to 54, like USGA)
  const clampedGsi = Math.max(-10, Math.min(54, newGsi));
  
  // Round to 1 decimal place
  return Math.round(clampedGsi * 10) / 10;
};

/**
 * Calculate relative handicaps for display (best player = 0)
 * @param gsiValues Array of GSI values
 * @returns Array of relative handicaps (GHI)
 */
export const calculateRelativeHandicaps = (gsiValues: number[]): number[] => {
  const minGsi = Math.min(...gsiValues);
  return gsiValues.map(gsi => Math.round((gsi - minGsi) * 10) / 10);
};
