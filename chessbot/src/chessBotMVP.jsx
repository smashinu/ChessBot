import React, { useEffect, useState, useRef } from "react";

import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Sounds,playBell, playTimer } from "./sounds";

import "./chessboardMVP.css";

export default function ChessBotMVP() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [timer, setTimer] = useState(60);
  const [activeColor, setActiveColor] = useState("w");
  const [isPaused, setIsPaused] = useState(false);
  const [showTimeoutPopup, setShowTimeoutPopup] = useState(false);
  const [skillLevel, setSkillLevel] = useState(0);
  const stockfishRef = useRef(null);
  
  

  const handleVictory = () => {
    alert("🏆 You win! Checkmate.");    
    Sounds("w");
    setIsPaused(true);
    if (skillLevel < 20) setSkillLevel(skillLevel + 1);
  };

  const handleDefeat = () => {
      alert("💀 You lost! Checkmate.");
      setIsPaused(true);
      Sounds("d");
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen("start");
    setIsBotThinking(false);
    setTimer(60);
    setActiveColor("w");
    setIsPaused(false);
    setShowTimeoutPopup(false);
  };  

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimer((prevTime) => {
        if (prevTime === 9) {
          playTimer();
        }

        if (prevTime <= 1) {
          clearInterval(interval);
          setIsPaused(true);
          setShowTimeoutPopup(true);
          playBell();
          return 0;
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeColor, isPaused]);

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (isPaused || isBotThinking) return false;

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;
  
    if(game.isCheck()) {
          Sounds("ch");
    }
    else{
       Sounds(move.flags);
    }
   
    if(game.isCheckmate()){
      handleVictory();
    }
    setFen(game.fen());
    setIsBotThinking(true);

    stockfishRef.current?.postMessage("position fen " + game.fen());
    stockfishRef.current?.postMessage("go depth 10");
    return true;
  };


  
  useEffect(() => {
    const stockfish = new Worker("/stockfish.js");
    stockfishRef.current = stockfish;

    stockfish.onmessage = (event) => {
      const message = typeof event.data === "string" ? event.data : event;

      if (message.startsWith("bestmove")) {
        const parts = message.split(" ");
        const move = parts[1];
        
        if (move === "(none)") return;
        
        const soundmove = game.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: "q",
        });

        setActiveColor((prevColor) => (prevColor === "w" ? "b" : "w"));
        if(game.isCheck()) {
          Sounds("ch");
        }

        else{
          Sounds(soundmove.flags);
        }
       
       
        console.log("Stockfish played:", move, "from FEN:", game.fen());
        setFen(game.fen());
        setIsBotThinking(false);

        if(game.isCheckmate()){
          handleDefeat();
        }

 
      }
    };

    // Controls the bot with post messages.
    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`)
    stockfish.postMessage("setoption name Skill Level Maximum Error value 200");
    stockfish.postMessage("setoption name Skill Level Probability value 1");
    stockfish.postMessage("isready");

    return () => stockfish.terminate();
  }, [game,skillLevel]);

  
  return (
    <div className="MainContainer">
      <div className="hero-banner">
        <div id="logoContainer">
            <img src="/images/Logo.webp"  id="tafeLogo" alt="South metro tafe"></img>
        </div>
        
        <div id="textContainer">
            <h2 className="hero-title"> Welcome to South Metropolitan afe ChessBot ♟️</h2>
            <p className="hero-subtitle">Sharpen your skills, beat the bot, and race against the clock.</p>
        </div>

      </div>
      <div className="timer-display">
        <span className={timer <= 5 ? "blink timer-red" : ""}>
          {String(Math.floor(timer / 60)).padStart(2, "0")}:
          {String(timer % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="ChessBoardContainer">
          <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={400}
          />
      </div>
     
      <button onClick={resetGame} className="px-4 py-2 bg-blue-500 text-white rounded">
        Reset Game
      </button>
      {showTimeoutPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Time's up!</h2>
            <button
              onClick={() => {
                setTimer(60);
                setShowTimeoutPopup(false);
                setIsPaused(false);
              }}
            >
              Resume Turn
            </button>
          </div>
        </div>
      )}
    </div>

    
  );
}
