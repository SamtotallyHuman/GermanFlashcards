import React from 'react';
import './WordInfo.css';

const DeclensionTable = ({ forms }) => {
  if (!forms || forms.length === 0) {
    return null;
  }

  const cases = ['nominative', 'accusative', 'dative', 'genitive'];
  const genders = ['masculine', 'feminine', 'neuter', 'plural'];

  const tableData = {};
  forms.forEach(form => {
    // Filter out irrelevant tags that can cause noise in the table.
    const noisyTags = ['inflection-template', 'table-tags', 'error-unrecognized-form'];
    if (form.tags.some(tag => noisyTags.includes(tag))) {
      return;
    }

    // Clean up the word string, taking only the primary word before any extra notes.
    const word = form.word.split(' ')[0];
    const hasCase = cases.find(c => form.tags.includes(c));
    if (!hasCase) return;

    let gender = genders.find(g => form.tags.includes(g));
    if (form.tags.includes('plural') && !form.tags.includes('singular')) {
      gender = 'plural';
    }

    if (hasCase && gender) {
      if (!tableData[hasCase]) {
        tableData[hasCase] = {};
      }
      // Only add if not already present to avoid duplicates
      if (!tableData[hasCase][gender]) {
        tableData[hasCase][gender] = word;
      }
    }
  });

  // Only render the table if we have some data
  if (Object.keys(tableData).length === 0) {
    return null;
  }

  return (
    <div className="declension-table-container">
      <h4>Declension</h4>
      <table className="declension-table">
        <thead>
          <tr>
            <th>Case</th>
            {genders.map(g => <th key={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</th>)}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr key={c}>
              <td>{c.charAt(0).toUpperCase() + c.slice(1)}</td>
              {genders.map(g => <td key={g}>{tableData[c]?.[g] || '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ConjugationTable = ({ forms }) => {
  if (!forms || forms.length === 0) {
    return null;
  }

  const persons = ['first-person', 'second-person', 'third-person'];
  const numbers = ['singular', 'plural'];
  const tenses = ['present', 'preterite']; // Focusing on Present and Past for now

  const tableData = {};

  forms.forEach(form => {
    const tense = tenses.find(t => form.tags.includes(t) && form.tags.includes('indicative'));
    if (!tense) return;

    const person = persons.find(p => form.tags.includes(p));
    const number = numbers.find(n => form.tags.includes(n));

    if (person && number) {
      if (!tableData[tense]) tableData[tense] = {};
      if (!tableData[tense][person]) tableData[tense][person] = {};

      // Avoid duplicates, prefer shorter word forms
      if (!tableData[tense][person][number] || form.word.length < tableData[tense][person][number].length) {
        tableData[tense][person][number] = form.word;
      }
    }
  });

  if (Object.keys(tableData).length === 0) {
    return null;
  }

  const personLabels = {
    'first-person': 'ich/wir',
    'second-person': 'du/ihr',
    'third-person': 'er,sie,es/sie',
  };

  return (
    <div className="conjugation-table-container">
      <h4>Conjugation (Indicative)</h4>
      <table className="conjugation-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Present (Präsens)</th>
            <th>Past (Präteritum)</th>
          </tr>
        </thead>
        <tbody>
          {persons.map(person => (
            <tr key={person}>
              <td>{personLabels[person]}</td>
              <td>{`${tableData.present?.[person]?.singular || '-'} / ${tableData.present?.[person]?.plural || '-'}`}</td>
              <td>{`${tableData.preterite?.[person]?.singular || '-'} / ${tableData.preterite?.[person]?.plural || '-'}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DefinitionDetails = ({ entry }) => {
  if (!entry) {
    return null;
  }

  const phonetic = entry.pronunciations?.find(p => p.type === 'ipa')?.text;

  return (
    <>
      {phonetic && <p><strong>Phonetic:</strong> {phonetic}</p>}
      <p><strong>Part of Speech:</strong> {entry.partOfSpeech}</p>
      <ul>
        {entry.senses?.map((sense, i) => (
          <li key={i}>
            {sense.definition}
            {sense.examples && sense.examples.length > 0 && (
              <ul className="example-list">
                {sense.examples.map((example, j) => (
                  <li key={j}><em>{example}</em></li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

const WordInfo = ({ info }) => {
  if (!info || !info.details) {
    return null;
  }

  // Find the first available 'forms' array, either in the main details or alternatives.
  let forms = info.details?.forms;
  if (!forms || forms.length === 0) {
    const altWithForms = info.alternativeDefinitions?.find(def => def.forms && def.forms.length > 0);
    if (altWithForms) {
      forms = altWithForms.forms;
    }
  }

  return (
    <div className="word-info">
      {info.details.partOfSpeech === 'verb' ? (
        <ConjugationTable forms={forms} />
      ) : (
        <DeclensionTable forms={forms} />
      )}
      <DefinitionDetails entry={info.details} />

      {info.alternativeDefinitions && info.alternativeDefinitions.length > 0 && (
        <div className="alternatives">
          <h4>Alternative Meanings:</h4>
          {info.alternativeDefinitions.map((alt, index) => (
            <div key={index} className="alternative-entry">
              <DefinitionDetails entry={alt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WordInfo;
