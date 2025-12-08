const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const lemmaMap = require('./lemmaMap.json');

const WORD_COUNT = 30;
const OUTPUT_PATH = path.join(__dirname, 'src', 'top3000.json');

const PART_OF_SPEECH_PRIORITY = [
    'verb',
    'article', // Prioritized article
    'pronoun',
    'preposition',
    'conjunction',
    'noun',
    'adverb',
    'adjective',
    'numeral',
	'contraction',
];

async function getWordData(word) {
    try {
        const url = `https://freedictionaryapi.com/api/v1/entries/de/${encodeURIComponent(word)}`;
        const response = await axios.get(url);
        // Return the entire data object, not just the first entry
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Word not found, which is expected for some words
            return null;
        }
        console.error(`Error fetching data for ${word}:`, error.message);
        return null;
    }
}

async function main() {
    try {
        const wordsToProcess = Object.keys(lemmaMap);

        console.log(`Processing to find ${WORD_COUNT} unique words...`);
        const flashcards = [];
        const seenBaseForms = new Set();

        for (const word of wordsToProcess) {
            const baseForm = lemmaMap[word.toLowerCase()] || word.toLowerCase();
            if (seenBaseForms.has(baseForm)) {
                continue;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
            const fullWordData = await getWordData(baseForm); // Renamed to fullWordData for clarity
            
            if (fullWordData && Array.isArray(fullWordData.entries) && fullWordData.entries.length > 0) {
                if (flashcards.length >= WORD_COUNT) break;

                let bestEntry = fullWordData.entries[0]; // Start with the first entry
                let bestPriority = PART_OF_SPEECH_PRIORITY.indexOf(bestEntry.partOfSpeech);
                let bestEntryIndex = 0;

                // Prioritize more useful parts of speech over others (e.g. article over numeral)
                // Iterate through all entries to find the one with the highest priority
                for (let i = 1; i < fullWordData.entries.length; i++) {
                    const currentEntry = fullWordData.entries[i];
                    const currentPriority = PART_OF_SPEECH_PRIORITY.indexOf(currentEntry.partOfSpeech);

                    // If currentEntry's partOfSpeech is in our priority list and has a higher priority
                    if (currentPriority !== -1 && (bestPriority === -1 || currentPriority < bestPriority)) {
                        bestPriority = currentPriority;
                        bestEntry = currentEntry;
                        bestEntryIndex = i;
                    }
                }

                // Now `bestEntry` holds the entry with the highest priority part of speech
                const partOfSpeech = bestEntry.partOfSpeech || null;
                let gender = null;

                // Find gender from the 'forms' array for nouns
                if (partOfSpeech === 'noun' && Array.isArray(bestEntry.forms)) {
                    const nominativeSingular = bestEntry.forms.find(form =>
                        form.tags && form.tags.includes('nominative') && form.tags.includes('singular')
                    );
                    if (nominativeSingular && nominativeSingular.word) {
                        // Extract gender from the nominative singular form (e.g., "der", "die", "das")
                        // Assuming the gender is the word itself for articles/determiners
                        gender = nominativeSingular.word.toLowerCase(); 
                    }
                }

                const senses = bestEntry.senses || [];
                const mainDefinition = senses.length > 0 ? senses[0].definition : null;

                // Store all other entries from the API as alternative definitions
                const alternativeDefinitions = fullWordData.entries.filter((_, index) => index !== bestEntryIndex);

                flashcards.push({
                    "default": {
                        "word": baseForm,
                        "wordForm": bestEntry.partOfSpeech || null,
                        "gender": gender,
                        "translation": mainDefinition,
                        "definition": mainDefinition,
                    },
					"alternativeDefinitions": alternativeDefinitions,
                    "details": bestEntry,
                });
                seenBaseForms.add(baseForm);
                console.log(`[${flashcards.length}/${WORD_COUNT}] Found: ${word} -> ${baseForm} (${bestEntry.partOfSpeech || 'N/A'}${gender ? ', ' + gender : ''})`);
            }
        }

        console.log(`Writing to ${OUTPUT_PATH}...`);
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(flashcards, null, 2));
        console.log('Successfully created top3000.json!');

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
