import { intialiseWeights } from './FlashcardGenerator';

describe('intialiseWeights', () => {
    it('should return an array of weights that sum to 1', () => {
        const weights = intialiseWeights();
        const sum = weights.reduce((acc, val) => acc + val, 0);
        expect(sum).toBeCloseTo(1);
    });

    it('should return an array of 101 weights', () => {
        const weights = intialiseWeights();
        expect(weights.length).toBe(101);
    });

    it('should have 0 as the first weight', () => {
        const weights = intialiseWeights();
        expect(weights[0]).toBe(0);
    });
});
