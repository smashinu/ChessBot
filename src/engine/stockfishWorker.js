export function createStockfishWorker() {
  return new Worker('/stockfish.js');
}