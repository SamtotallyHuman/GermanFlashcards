import { useEffect, useState } from "react";
import "./Flashcard.css";
import data from "../top3000.json";
import WordInfo from "./WordInfo";

function getFrontText(id) {
    if (id > 0 && id <= data.length) {
        return data[id - 1].word;
    }
    return "Loading...";
}

function getBackText(id) {
    if (id > 0 && id <= data.length) {
        return data[id - 1];
    }
    return null;
}

export const Flashcard = ({ id, onAction }) => {
    const [flipped, setFlipped] = useState(false);
    const [frontText, setFrontText] = useState(() => getFrontText(id));
    const [backText, setBackText] = useState(() => getBackText(id));

    useEffect(() => {
        setFrontText(getFrontText(id));
        setFlipped(false);
    }, [id]);


    function toggleReveal() {
        if (!flipped) {
            setBackText(getBackText(id));
        }
        setFlipped((s) => !s);
    }

    return (
        <div className="flashcard-container">
            <div className="flashcard">
                <div
                    className={`card ${flipped ? "flipped" : ""}`}
                    onClick={toggleReveal}
                >
                    <div className="card-face card-front">
                        <div className="front-text">{frontText}</div>
                        <div className="reveal-text">Click to reveal</div>
                    </div>
                    <div className="card-face card-back">
                        {backText && (
                            <>
                                <div className="back-text-header">
                                    <span className="back-text-word">{backText.word}</span>
                                    <span className="back-text-translation">{backText.translation}</span>
                                </div>
                                <WordInfo info={backText} />
                            </>
                        )}
                         <div className="reveal-text">Click to hide</div>
                    </div>
                </div>
            </div>
            <div className="controls">
                <button
                    type="button"
                    onClick={() => onAction(true)}
                    className="control-button correct-button"
                >
                    Correct
                </button>
                <button
                    type="button"
                    onClick={() => onAction(false)}
                    className="control-button incorrect-button"
                >
                    Incorrect
                </button>
            </div>
        </div>
    );
};

