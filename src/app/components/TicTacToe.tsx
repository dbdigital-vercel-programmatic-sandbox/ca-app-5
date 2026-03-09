"use client";

import { useState, useCallback } from "react";
import { bridge } from "@/lib/bridge";

type Player = "ironman" | "captain" | null;
type Board = Player[];

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): Player {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function IronManIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="45" fill="#C41E3A" />
      <circle cx="50" cy="50" r="35" fill="#FFD700" />
      <rect x="30" y="35" width="40" height="15" rx="3" fill="#C41E3A" />
      <circle cx="42" cy="42" r="4" fill="#87CEEB" />
      <circle cx="58" cy="42" r="4" fill="#87CEEB" />
      <rect x="35" y="60" width="30" height="8" rx="2" fill="#C41E3A" />
    </svg>
  );
}

function CaptainAmericaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="45" fill="#1E3A8A" />
      <circle cx="50" cy="50" r="35" fill="transparent" stroke="#C0C0C0" strokeWidth="4" />
      <circle cx="50" cy="50" r="25" fill="#1E3A8A" stroke="#C0C0C0" strokeWidth="3" />
      <polygon points="50,20 56,38 76,38 60,50 66,68 50,56 34,68 40,50 24,38 44,38" fill="#C0C0C0" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function RestartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"ironman" | "captain">("ironman");
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ ironman: 0, captain: 0 });
  const [shareStatus, setShareStatus] = useState<string>("");

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || winner || isDraw) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setScores((prev) => ({
          ...prev,
          [gameWinner]: prev[gameWinner] + 1,
        }));
      } else if (newBoard.every((cell) => cell !== null)) {
        setIsDraw(true);
      } else {
        setCurrentPlayer(currentPlayer === "ironman" ? "captain" : "ironman");
      }
    },
    [board, currentPlayer, winner, isDraw]
  );

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("ironman");
    setWinner(null);
    setIsDraw(false);
    setShareStatus("");
  }, []);

  const handleShare = useCallback(() => {
    const winnerText = winner
      ? winner === "ironman"
        ? "Iron Man"
        : "Captain America"
      : isDraw
      ? "It's a Draw"
      : "Game in Progress";

    const shareText = `Marvel Tic Tac Toe - ${winnerText}! Iron Man ${scores.ironman} - ${scores.captain} Captain America`;

    bridge.methodExists(["shareArticleV2", "shareArticle", "genericShareV1"]).or(
      (available) => {
        const method = available[0];
        if (method === "shareArticleV2") {
          bridge
            .shareArticleV2({
              title: "Marvel Tic Tac Toe",
              description: shareText,
              url: window.location.href,
            })
            .then(() => setShareStatus("Shared successfully!"))
            .catch(() => setShareStatus("Share failed"));
        } else if (method === "shareArticle") {
          bridge
            .shareArticle({
              title: "Marvel Tic Tac Toe",
              description: shareText,
              url: window.location.href,
            })
            .then(() => setShareStatus("Shared successfully!"))
            .catch(() => setShareStatus("Share failed"));
        } else if (method === "genericShareV1") {
          bridge
            .genericShareV1({
              text: shareText,
              url: window.location.href,
            })
            .then(() => setShareStatus("Shared successfully!"))
            .catch(() => setShareStatus("Share failed"));
        }
      }
    ).else(() => {
      // Fallback to Web Share API
      if (navigator.share) {
        navigator
          .share({
            title: "Marvel Tic Tac Toe",
            text: shareText,
            url: window.location.href,
          })
          .then(() => setShareStatus("Shared successfully!"))
          .catch(() => setShareStatus("Share cancelled"));
      } else {
        // Fallback to clipboard
        navigator.clipboard
          .writeText(`${shareText} - ${window.location.href}`)
          .then(() => setShareStatus("Copied to clipboard!"))
          .catch(() => setShareStatus("Copy failed"));
      }
    });
  }, [winner, isDraw, scores]);

  const getStatusMessage = () => {
    if (winner) {
      return (
        <div className="flex items-center gap-3">
          {winner === "ironman" ? (
            <>
              <IronManIcon className="w-10 h-10" />
              <span className="text-red-500 font-bold">Iron Man Wins!</span>
            </>
          ) : (
            <>
              <CaptainAmericaIcon className="w-10 h-10" />
              <span className="text-blue-400 font-bold">Captain America Wins!</span>
            </>
          )}
        </div>
      );
    }
    if (isDraw) {
      return <span className="text-gray-400 font-bold">It&apos;s a Draw!</span>;
    }
    return (
      <div className="flex items-center gap-3">
        {currentPlayer === "ironman" ? (
          <>
            <IronManIcon className="w-8 h-8" />
            <span className="text-red-400">Iron Man&apos;s Turn</span>
          </>
        ) : (
          <>
            <CaptainAmericaIcon className="w-8 h-8" />
            <span className="text-blue-400">Captain America&apos;s Turn</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="text-red-500">MARVEL</span>
          <span className="text-white"> TAC TOE</span>
        </h1>
        <p className="text-gray-400 text-sm">Iron Man vs Captain America</p>
      </div>

      {/* Score Board */}
      <div className="flex items-center gap-6 bg-gray-900/80 rounded-2xl px-6 py-3 border border-gray-700">
        <div className="flex flex-col items-center">
          <IronManIcon className="w-8 h-8" />
          <span className="text-red-400 font-bold text-lg">{scores.ironman}</span>
        </div>
        <div className="text-gray-500 font-bold text-xl">VS</div>
        <div className="flex flex-col items-center">
          <CaptainAmericaIcon className="w-8 h-8" />
          <span className="text-blue-400 font-bold text-lg">{scores.captain}</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-xl h-12 flex items-center justify-center">
        {getStatusMessage()}
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center transition-all duration-200
              ${
                cell
                  ? "bg-gray-800"
                  : "bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer"
              }
              ${!cell && !winner && !isDraw ? "hover:scale-105" : ""}
              border border-gray-700
            `}
            disabled={!!cell || !!winner || isDraw}
          >
            {cell === "ironman" && (
              <IronManIcon className="w-14 h-14 sm:w-16 sm:h-16 animate-in zoom-in duration-200" />
            )}
            {cell === "captain" && (
              <CaptainAmericaIcon className="w-14 h-14 sm:w-16 sm:h-16 animate-in zoom-in duration-200" />
            )}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-medium transition-colors border border-gray-600"
        >
          <RestartIcon className="w-4 h-4" />
          Restart
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-medium transition-colors shadow-lg shadow-red-900/50"
        >
          <ShareIcon className="w-4 h-4" />
          Share Result
        </button>
      </div>

      {/* Share Status */}
      {shareStatus && (
        <p className="text-sm text-gray-400 animate-in fade-in slide-in-from-bottom-2">
          {shareStatus}
        </p>
      )}

      {/* Player Legend */}
      <div className="flex gap-6 text-sm text-gray-500 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Iron Man (X)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Captain America (O)</span>
        </div>
      </div>
    </div>
  );
}
