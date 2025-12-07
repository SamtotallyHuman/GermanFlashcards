import './App.css';
import { createContext, useContext, useEffect, useState } from 'react';
import { FlashcardGenerator } from './components/FlashcardGenerator';

const WeightContext = createContext()
export const useWeight = () => useContext(WeightContext);

function App() {

    const [weights, setWeights] = useState(() => {
        const stored = localStorage.getItem('weights');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('weights', JSON.stringify(weights));
    }, [weights])
        
    return (
        <div className="App">
            <WeightContext.Provider value={{weights, setWeights}}>
                <FlashcardGenerator />
            </WeightContext.Provider>
        </div>
    );
}

export default App;
