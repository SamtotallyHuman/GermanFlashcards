import React from 'react';
import './Settings.css';

export const Settings = ({ mode, setMode, nValue, setNValue, onReset, selectedTypes, setSelectedTypes, uniformMin, setUniformMin, uniformMax, setUniformMax }) => {
    const wordTypes = [
        'verb',
        'noun',
        'adjective',
        'adverb',
        'preposition',
        'pronoun',
        'article',
        'conjunction',
        'other',
    ];

    const handleTypeChange = (event) => {
        const { name, checked } = event.target;
        setSelectedTypes(prev => ({ ...prev, [name]: checked }));
    };
    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>Settings</h2>
            </div>
            <div className="settings-content">
                <div className="setting">
                    <label htmlFor="mode-select">Mode:</label>
                    <select id="mode-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value="Uniform">Uniform</option>
						<option value="Dynamic">Dynamic</option>
                        <option value="Fixed">Fixed</option>
                    </select>
                </div>
                {mode === 'Fixed' && (
                    <div className="setting">
                        <label htmlFor="n-value">N: (Max 1000)</label>
                        <input
                            id="n-value"
                            type="number"
                            value={nValue}
                            onChange={(e) => setNValue(parseInt(e.target.value, 10))}
                        />
                    </div>
                )}
                {mode === 'Uniform' && (
                    <>
                        <div className="setting">
                            <label htmlFor="uniform-min">Min Rank:</label>
                            <input
                                id="uniform-min"
                                type="number"
                                value={uniformMin}
                                onChange={(e) => setUniformMin(parseInt(e.target.value, 10))}
                            />
                        </div>
                        <div className="setting">
                            <label htmlFor="uniform-max">Max Rank: (Max 1000)</label>
                            <input
                                id="uniform-max"
                                type="number"
                                value={uniformMax}
                                onChange={(e) => setUniformMax(parseInt(e.target.value, 10))}
                            />
                        </div>
                    </>
                )}
                <div className='setting'>
                    <label>Word Types:</label>
                    <div className="checkbox-group">
                        {wordTypes.map((type) => (
                            <div key={type}>
                                <input
                                    type="checkbox"
                                    id={`type-${type}`}
                                    name={type}
                                    checked={selectedTypes[type] || false}
                                    onChange={handleTypeChange}
                                />
                                <label htmlFor={`type-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="setting">
                    <button
                        type="button"
                        onClick={onReset}
                        className="control-button incorrect-button"
                    >
                        Reset Data
                    </button>
                </div>
            </div>
        </div>
    );
};
