import React from 'react';
import './WordInfo.css';

const WordInfo = ({ info }) => {
  if (!info) {
    return null;
  }

  return (
    <div className="word-info">
      {info.phonetic && <p><strong>Phonetic:</strong> {info.phonetic}</p>}
      {info.meanings && info.meanings.map((meaning, index) => (
        <div key={index}>
          <p><strong>Part of Speech:</strong> {meaning.partOfSpeech}</p>
          <ul>
            {meaning.definitions.map((definition, i) => (
              <li key={i}>
                {definition.definition}
                {definition.examples && definition.examples.length > 0 && (
                  <ul>
                    {definition.examples.map((example, j) => (
                      <li key={j}><em>{example}</em></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default WordInfo;

