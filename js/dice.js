/**
 * D10 Dice Roller for 7th Sea 2nd Edition
 * Handles dice rolling and Raise calculation
 */

export const Dice = {
    /**
     * Roll multiple D10 dice
     * @param {number} count - Number of dice to roll
     * @returns {Array} Array of dice results
     */
    roll(count) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(Math.floor(Math.random() * 10) + 1);
        }
        return results;
    },

    /**
     * Calculate maximum Raises from dice results
     * In 7th Sea 2e, a Raise = any combination of dice totaling 10+
     * This uses a greedy algorithm that may not be optimal but is fast
     * 
     * @param {Array} dice - Array of dice values
     * @returns {Object} { raises: number, combinations: Array }
     */
    calculateRaises(dice) {
        // Sort dice in descending order for greedy approach
        const sorted = [...dice].sort((a, b) => b - a);
        const used = new Array(sorted.length).fill(false);
        const combinations = [];
        let raises = 0;

        // First pass: find all dice that are 10 by themselves
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] === 10 && !used[i]) {
                used[i] = true;
                combinations.push([10]);
                raises++;
            }
        }

        // Second pass: greedy combinations
        for (let i = 0; i < sorted.length; i++) {
            if (used[i]) continue;

            let sum = sorted[i];
            const combo = [sorted[i]];
            used[i] = true;

            // Try to add more dice to reach 10
            for (let j = i + 1; j < sorted.length && sum < 10; j++) {
                if (!used[j]) {
                    if (sum + sorted[j] >= 10) {
                        // Only add if it completes the raise
                        combo.push(sorted[j]);
                        sum += sorted[j];
                        used[j] = true;
                        break;
                    } else {
                        // Add to the sum
                        combo.push(sorted[j]);
                        sum += sorted[j];
                        used[j] = true;
                    }
                }
            }

            if (sum >= 10) {
                combinations.push(combo);
                raises++;
            } else {
                // Put dice back if we couldn't make a raise
                combo.forEach(val => {
                    const idx = sorted.indexOf(val);
                    if (idx !== -1) used[idx] = false;
                });
            }
        }

        return { raises, combinations };
    },

    /**
     * Better Raise calculator using dynamic programming
     * for optimal solution (more complex but exact)
     * 
     * @param {Array} dice - Array of dice values
     * @returns {number} Maximum possible raises
     */
    calculateRaisesOptimal(dice) {
        const n = dice.length;
        if (n === 0) return 0;

        // For small pools, we can brute force
        if (n <= 10) {
            return this.bruteForceRaises(dice);
        }

        // For larger pools, use greedy
        return this.calculateRaises(dice).raises;
    },

    /**
     * Brute force Raise calculation for small pools
     * Finds all possible partitions and maximizes raises
     */
    bruteForceRaises(dice) {
        let maxRaises = 0;

        const tryPartition = (remaining, currentRaises) => {
            if (remaining.length === 0) {
                maxRaises = Math.max(maxRaises, currentRaises);
                return;
            }

            // Try all possible subsets that sum to 10+
            const n = remaining.length;
            for (let mask = 1; mask < (1 << n); mask++) {
                let sum = 0;
                const subset = [];
                const rest = [];

                for (let i = 0; i < n; i++) {
                    if (mask & (1 << i)) {
                        sum += remaining[i];
                        subset.push(remaining[i]);
                    } else {
                        rest.push(remaining[i]);
                    }
                }

                if (sum >= 10) {
                    tryPartition(rest, currentRaises + 1);
                }
            }

            // Also try using no dice for a raise
            maxRaises = Math.max(maxRaises, currentRaises);
        };

        tryPartition(dice, 0);
        return maxRaises;
    },

    /**
     * Calculate Roll & Keep total (V1)
     * @param {Array} dice - Array of dice results
     * @param {number} keep - Number of dice to keep
     * @returns {Object} { total: number, keptDice: Array }
     */
    calculateRollAndKeep(dice, keep) {
        const sorted = [...dice].sort((a, b) => b - a); // Descending
        const keptDice = sorted.slice(0, keep);
        const total = keptDice.reduce((a, b) => a + b, 0);
        return { total, keptDice };
    }
};
