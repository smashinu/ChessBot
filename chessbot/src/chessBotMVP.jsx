import React, { useEffect, useState, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

export default function ChessBotMVP() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const stockfishRef = useRef(null);

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (isBotThinking) return false;

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

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

        game.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: "q",
        });
        console.log("Stockfish played:", move, "from FEN:", game.fen());
        setFen(game.fen());
        setIsBotThinking(false);
      }
    };

    stockfish.postMessage("uci");
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
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Chess Bot MVP</h1>
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardWidth={400}
      />
      <button onClick={resetGame} className="px-4 py-2 bg-blue-500 text-white rounded">
        Reset Game
      </button>
    </div>
  );
}
