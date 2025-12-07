import { useEffect, useState } from "react";
import { useWeight } from "../App";
import { Flashcard } from "./Flashcard";
import { Settings } from "./Settings";

function intialiseWeights() {
    const weights = Array.from({ length: 101 }, (_, i) => i === 0 ? 0 : 1 / i);
    const total = weights.reduce((acc, val) => acc + val, 0);
    return weights.map(w => w / total);
}

function sampleFromWeights(weights, n) {
    const limit = n || weights.length;
    const weightsToConsider = weights.slice(0, limit);
    const totalWeight = weightsToConsider.reduce((sum, weight) => sum + weight, 0);

    const r = Math.random() * totalWeight;
    let cumulative = 0;

    for (let i = 0; i < limit; i++) {
        cumulative += weightsToConsider[i];
        if (r <= cumulative) return i + 1; // return index in 1..N
    }

    return limit;
}

const hyperparameters = {
    alpha: 0.8,    // reinforcement strength
    theta: 0.5,    // baseline bias
    tau: 0.05,     // mastery probability threshold
    rho: 0.7,      // fraction mastered before expansion
    K: 10,         // number of new words to unlock
    N_tot: 336000,   // total vocabulary size
};

// --- Global state (initialization example) ---
let N_active = 50; // initial number of active words

// Helper: normalize array on first N elements
function normalize(arr, N) {
  const s = arr.slice(0, N).reduce((a, b) => a + b, 0);
  if (s === 0) return arr;
  for (let i = 0; i < N; i++) arr[i] /= s;
  return arr;
}

function updateWeights(oldWeights, currentID, successFlag, mode, nValue) {
    const P = oldWeights.slice(); // shallow copy

    // Step 1: Reinforce queried index
    P[currentID] *= Math.exp(hyperparameters.alpha * (successFlag - hyperparameters.theta));

    if (mode === 'Fixed') {
        // Normalise on active support
        normalize(P, nValue);
    } else {
        const N_prev = N_active;

        // Normalise on active support
        normalize(P, N_prev);

        // Step 2: Check mastery condition for expansion
        let mastered = 0;
        for (let i = 0; i < N_prev; i++) {
            if (P[i] >= hyperparameters.tau) mastered++;
        }

        let N_new = N_prev;
        if (mastered / N_prev >= hyperparameters.rho) {
            N_new = Math.min(N_prev + hyperparameters.K, hyperparameters.N_tot);
        }

        // Step 3: Initialise new words with weights ~ 1/i
        if (N_new > N_prev) {
            for (let i = N_prev; i < N_new; i++) {
                P[i] = 1 / (i + 1); // frequency-based prior
            }
        }

        // Step 4: Zero out unused tail and renormalise full support
        for (let i = N_new; i < hyperparameters.N_tot; i++) {
            P[i] = 0;
        }
        normalize(P, N_new);

        // Update global active frontier
        N_active = N_new;
    }

    return P;
}

export const FlashcardGenerator = () => {
    const { weights, setWeights } = useWeight();
    const [currentID, setCurrentID] = useState(0)
    const [mode, setMode] = useState('Dynamic');
    const [nValue, setNValue] = useState(100);

    if (weights[0] === undefined) {
        setWeights(intialiseWeights())
    }

    useEffect(() => {
        if (mode === 'Fixed') {
            setCurrentID(sampleFromWeights(weights, nValue))
        } else {
            setCurrentID(sampleFromWeights(weights))
        }
    }, [weights, mode, nValue])

    function returnScore(successFlag) {
        const success = successFlag ? 1 : 0;
        setWeights(updateWeights(weights, currentID, success, mode, nValue));
    }

    function handleReset() {
        if (window.confirm("Are you sure you want to reset your progress? This cannot be undone.")) {
            setWeights(intialiseWeights());
        }
    }

    return (
        <>
            <Flashcard id={currentID} onAction={returnScore} />
            <Settings mode={mode} setMode={setMode} nValue={nValue} setNValue={setNValue} onReset={handleReset} />
        </>
    )
}
