const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const lemmaMap = require('./src/lemmaMap.json');

const WORD_COUNT = 15;
const FREQUENCY_LIST_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/de/de_50k.txt';
const OUTPUT_PATH = path.join(__dirname, 'src', 'top3000.json');

function getBaseForm(word, lemmaMap) {
    return lemmaMap[word.toLowerCase()] || word.toLowerCase();
}

async function getFrequencyList() {
    console.log('Fetching frequency list...');
    const response = await axios.get(FREQUENCY_LIST_URL);
    const text = response.data;
    return text.split(/\r?\n/)
        .map(line => line.split(' ')[0])
        .filter(word => word && isNaN(word));
}

async function getWordData(word) {
    try {
        const url = `https://freedictionaryapi.com/api/v1/entries/de/${encodeURIComponent(word)}`;
        const response = await axios.get(url);
        const data = response.data.entries[0];
		console.log(data)
        if (!data) return null;

        const phonetic = data.phonetic;
        const meanings = data.meanings.map(m => ({
            partOfSpeech: m.partOfSpeech,
            definitions: m.definitions.map(d => ({
                definition: d.definition,
                example: d.example || ''
            }))
        }));

        return {
            word: data.word,
            phonetic: phonetic,
            meanings: meanings
        };
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
        const topWords = await getFrequencyList();

        console.log(`Processing to find ${WORD_COUNT} unique words...`);
        const flashcards = [];
        const seenBaseForms = new Set();

        for (const germanWord of topWords) {
            if (flashcards.length >= WORD_COUNT) break;

            const baseForm = getBaseForm(germanWord, lemmaMap);
            if (seenBaseForms.has(baseForm)) {
                continue;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
            const data = await getWordData(baseForm);
			console.log(data)
			if (data) {
                flashcards.push(data);
                seenBaseForms.add(baseForm);
                console.log(`[${flashcards.length}/${WORD_COUNT}] Found: ${germanWord} -> ${data.word}`);
            }
        }

        console.log(`Found ${flashcards.length} words with required data.`);
        console.log(`Writing to ${OUTPUT_PATH}...`);
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(flashcards, null, 2));
        console.log('Successfully created top3000.json!');

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
