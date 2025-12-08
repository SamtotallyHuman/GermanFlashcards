const fs = require('fs').promises;
const path = require('path');

const INPUT_PATH = 'words.txt';
const OUTPUT_PATH = path.join(__dirname, 'lemmaMap.json');

async function createLemmaMap() {
    try {
        console.log(`Reading ${INPUT_PATH}...`);
        const fileContent = await fs.readFile(INPUT_PATH, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        const lemmaMap = {};

        for (const line of lines) {
            if (line.startsWith('#') || line.trim() === '') {
                continue;
            }

            let parts = line.split('\t');
            if (parts.length < 2) {
                parts = line.split(' ');
                if (parts.length < 2) {
                    continue;
                }
            }

            const wordPart = parts[0];
            let baseForm = wordPart;
            const forms = [];

            const parenMatch = wordPart.match(/([a-zA-Z\u00E0-\u00FC]+)\(([^)]+)\)/);
            if (parenMatch) {
                baseForm = parenMatch[1];
                forms.push(baseForm);
                const suffixes = parenMatch[2].split(',');
                for (const suffix of suffixes) {
                    forms.push(baseForm + suffix);
                }
            } else if (wordPart.includes(',')) {
                const words = wordPart.split(',');
                baseForm = words[0];
                forms.push(...words);
            } else {
                forms.push(baseForm);
            }

            for (const form of forms) {
                if (form) {
                    lemmaMap[form.toLowerCase()] = baseForm.toLowerCase();
                }
            }
        }

        console.log(`Writing to ${OUTPUT_PATH}...`);
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(lemmaMap, null, 2));
        console.log('Successfully created lemmaMap.json!');

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

createLemmaMap();
