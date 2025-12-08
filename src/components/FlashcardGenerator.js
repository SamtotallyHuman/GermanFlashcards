import { useEffect, useState } from "react";
import { useWeight } from "../App";
import { Flashcard } from "./Flashcard";
import { Settings } from "./Settings";
import data from "../top3000.json";

function intialiseWeights() {
    const weights = Array.from({ length: 101 }, (_, i) => i === 0 ? 0 : 1 / i);
    const total = weights.reduce((acc, val) => acc + val, 0);
    return weights.map(w => w / total);
}

function sampleFromWeights(weights, n) {
    const limit = n || weights.length;
    const weightsToConsider = weights.slice(0, limit);
    const totalWeight = weightsToConsider.reduce((sum, weight) => sum + weight, 0);

    if (totalWeight === 0) {
        return 0;
    }

    const r = Math.random() * totalWeight;
    let cumulative = 0;

    for (let i = 0; i < limit; i++) {
        cumulative += weightsToConsider[i];
        if (r <= cumulative && weightsToConsider[i] > 0) {
            return i + 1; // return index in 1..N
        }
    }

    // Fallback for floating point issues where r might be slightly larger than totalWeight
    for (let i = limit - 1; i >= 0; i--) {
        if (weightsToConsider[i] > 0) {
            return i + 1;
        }
    }

    return 0; // Should not be reached if totalWeight > 0
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
    const [mode, setMode] = useState('Uniform');
    const [nValue, setNValue] = useState(100);
    const [uniformMin, setUniformMin] = useState(1);
    const [uniformMax, setUniformMax] = useState(100);
    const [selectedTypes, setSelectedTypes] = useState({
        'verb': true,
        'article': true,
        'pronoun': true,
        'preposition': true,
        'conjunction': true,
        'noun': true,
        'adverb': true,
        'adjective': true,
        'other': true
    });

    if (weights[0] === undefined) {
        setWeights(intialiseWeights())
    }

    useEffect(() => {
        if (!Object.values(selectedTypes).some(v => v)) {
            setCurrentID(0);
            return;
        }

        const specificTypes = Object.keys(selectedTypes).filter(t => t !== 'other');

        if (mode === 'Uniform') {
            const possibleIDs = [];
            const min = Math.max(1, uniformMin || 1);
            const max = Math.min(data.length, uniformMax || 100);

            for (let i = min - 1; i < max; i++) {
                const wordData = data[i];
                if (wordData && wordData.details) {
                    const pos = wordData.details.partOfSpeech;

                    if (selectedTypes[pos] || (selectedTypes.other && !specificTypes.includes(pos))) {
                        possibleIDs.push(i + 1);
                    }
                }
            }

            if (possibleIDs.length > 0) {
                const randomIndex = Math.floor(Math.random() * possibleIDs.length);
                setCurrentID(possibleIDs[randomIndex]);
            } else {
                setCurrentID(0);
            }
            return;
        }

        const weightsToSample = weights.map((weight, index) => {
            const wordData = data[index];
            if (wordData && wordData.details) {
                const pos = wordData.details.partOfSpeech;

                // If the part of speech is one of the specific types and it's selected
                if (selectedTypes[pos]) {
                    return weight;
                }

                // If 'other' is selected and the part of speech is not one of the specific types
                if (selectedTypes.other && !specificTypes.includes(pos)) {
                    return weight;
                }
            }
            return 0;
        });

        let newID;
        if (mode === 'Fixed') {
            newID = sampleFromWeights(weightsToSample, nValue);
        } else {
            newID = sampleFromWeights(weightsToSample);
        }
        setCurrentID(newID);
    }, [weights, mode, nValue, selectedTypes, uniformMin, uniformMax])

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
            <Settings
                mode={mode}
                setMode={setMode}
                nValue={nValue}
                setNValue={setNValue}
                uniformMin={uniformMin}
                setUniformMin={setUniformMin}
                uniformMax={uniformMax}
                setUniformMax={setUniformMax}
                onReset={handleReset}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
            />
        </>
    )
}
