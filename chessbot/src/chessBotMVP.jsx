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
  const [showInvalidMovePopup, setShowInvalidMovePopup] = useState(false);
  const [skillLevel, setSkillLevel] = useState(0);
  const stockfishRef = useRef(null);
  
  const handleGameState = (game) => {
      if(game.isCheckmate()){
        handleVictory();
        return;
      } 
      else if(game.isDraw()){
         handleDraw();
         return;
      }
      else if(game.isStalemate()) {
        handleStaleMate();
        return
      }
  }

  const handleDraw = () => {
      alert("It's a draw!");
      setIsPaused(true);
      return;
  }

  const handleStaleMate = () => {
      alert("Stalemate!");
      setIsPaused(true);
      return;
  }

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
    try{
        const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

    
      if(!move) return false;
  
      if(game.isCheck()) {
            Sounds("ch");
      }
      else{
        Sounds(move.flags);
      }
    
  
      
      setFen(game.fen());
      setIsBotThinking(true);
      handleGameState(game);
      stockfishRef.current?.postMessage("position fen " + game.fen());
      stockfishRef.current?.postMessage("go depth 10");
      return true;
    }
    catch{
       setShowInvalidMovePopup(true);
       return;
    }
    
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
          if(soundmove){
              Sounds("ch");
          }
   
        }

        else{
          if(soundmove){
              Sounds(soundmove.flags);
          }
       
        }
       
        
        console.log("Stockfish played:", move, "from FEN:", game.fen());
        setFen(game.fen());
        setIsBotThinking(false);
        handleGameState(game);
 
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
  }, [skillLevel]);

  
  return (
    <div className="MainContainer">
      <div className="hero-banner">
        <div id="logoContainer">
            <img src="/images/Logo.webp"  id="tafeLogo" alt="South metro tafe"></img>
        </div>
        
        <div id="textContainer">
            <h2 className="hero-title"> Welcome to South Metropolitan Tafe ChessBot ♟️</h2>
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
     
      <button onClick={resetGame} className="btn-primary">
        Reset Game
      </button>
      {showTimeoutPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Time's up!</h2>
            <button
              className="btn-primary"
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
      {showInvalidMovePopup && (
        <div className="invalid-move-modal-overlay">
          <div className="invalid-move-modal">
            <p>⛔ Can't move there, sorry mate</p>
            <button onClick={() => setShowInvalidMovePopup(false)} className="btn-primary">OK</button>
          </div>
        </div>
      )}
    </div>

    
  );
}
