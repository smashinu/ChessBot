import React, { useEffect, useState, useRef } from "react";

import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Sounds } from "./sounds";

import "./chessboardMVP.css";

export default function ChessBotMVP() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const stockfishRef = useRef(null);
  let CurrentSkillLevel = 0;
  

  const handleVictory = () => {
    alert("🏆 You win! Checkmate.");    
    Sounds("w");
    if (CurrentSkillLevel < 20) CurrentSkillLevel++;
  };

const handleDefeat = () => {
    alert("💀 You lost! Checkmate.");
    Sounds("d");
  };


  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (isBotThinking) return false;

    

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;
    console.log(game.isCheck());
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

        console.log(`bot checked me? ${game.isCheck()}`);
        if(game.isCheck()) {
          Sounds("ch");
        }

        else{
          Sounds(soundmove.flags);
        }
       
        if(game.isCheckmate()){
          handleDefeat();
        }

        //console.log("Stockfish played:", move, "from FEN:", game.fen());
        setFen(game.fen());
        setIsBotThinking(false);

      
 
      }
    };

    // Controls the bot with post messages.
    stockfish.postMessage("uci");
    stockfish.postMessage("isready");
    stockfish.postMessage(`setoption name Skill Level value ${CurrentSkillLevel}`)
    stockfish.postMessage("setoption name Skill Level Maximum Error value 200");
    stockfish.postMessage("setoption name Skill Level Probability value 1");
    stockfish.postMessage("isready");

    return () => stockfish.terminate();
  }, [game]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen("start");
    setIsBotThinking(false);
  };




  return (
    <div className="MainContainer">
      <h1 className="text-2xl font-bold">Chess Bot MVP</h1>
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
    </div>
  );
}
