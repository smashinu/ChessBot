import React, { useEffect, useState, useRef } from "react";

import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Sounds } from "./sounds";

import "./chessBotMVP.css";

export default function ChessBotMVP() {
  const [fen, setFen] = useState("start");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showInvalidMovePopup, setShowInvalidMovePopup] = useState(false);
  const [skillLevel, setSkillLevel] = useState(0);
  const stockfishRef = useRef(null);
  const gameRef = useRef(new Chess());

  const handleGameState = (game) => {
      if(gameRef.current.isCheckmate()){
        handleVictory();
        return;
      } 
      else if(gameRef.current.isDraw()){
         handleDraw();
         return;
      }
      else if(gameRef.current.isStalemate()) {
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
    gameRef.current = new Chess();
    setFen("start");
    setIsBotThinking(false);
    setIsPaused(false);
  };  


  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (isPaused || isBotThinking) return false;
  
    try {
      const piece = gameRef.current.get(sourceSquare);
      const moveDetails = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q"
      };
  
      if (piece?.type === "p" && (targetSquare[1] === "1" || targetSquare[1] === "8")) {
        moveDetails.promotion = "q";
      }
  
      const move = gameRef.current.move(moveDetails);
      if (!move) return false;
  
      if (gameRef.current.isCheck()) {
        Sounds("ch");
      } else {
        Sounds(move.flags);
      }
  
      setFen(gameRef.current.fen());
      setIsBotThinking(true);
      handleGameState(gameRef.current);
      stockfishRef.current?.postMessage("position fen " + gameRef.current.fen());
      stockfishRef.current?.postMessage("go depth 10");
  
      return true;
    } catch {
      setShowInvalidMovePopup(true);
      return;
    }
  };

  
  // Stockfish handler.
  useEffect(() => {
    const stockfish = new Worker("/stockfish.js");
    stockfishRef.current = stockfish;
  
    stockfish.onmessage = (event) => {
      const message = typeof event.data === "string" ? event.data : event;
  
      if (message.startsWith("bestmove")) {
        const move = message.split(" ")[1];
        if (move === "(none)") return;
  
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const moveDetails = { from, to, promotion: "q" };
    
  
        const soundmove = gameRef.current.move(moveDetails);
        
        if (gameRef.current.isCheck() && soundmove) {
          Sounds("ch");
        } else if (soundmove) {
          Sounds(soundmove.flags);
        }
  
        console.log("Stockfish played:", move, "from FEN:", gameRef.current.fen());
        setFen(gameRef.current.fen());
        setIsBotThinking(false);
  
        if (gameRef.current.isCheckmate()) handleDefeat();
        else handleGameState(gameRef.current);
      }
    };
  
    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`);
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
      <div className="ChessBoardContainer">
          <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={400}
          />
      </div>
     
      <button onClick={resetGame} className="btn-primary">
        Reset game!
      </button>
 
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
