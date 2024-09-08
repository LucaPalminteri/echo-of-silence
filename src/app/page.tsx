"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Info } from "lucide-react";

interface ObjectPosition {
  id: number;
  x: number;
  y: number;
  revealedBy?: number;
}

interface PlayerInfo {
  name: string;
  score: number;
}

interface ClickPosition {
  x: number;
  y: number;
}

const GameInfoModal: React.FC = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Echo of Silence - Game Rules</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p>Welcome to Echo of Silence, a two-player game of discovery and strategy!</p>
        <h3 className="font-bold">How to Play:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Players take turns clicking anywhere on the screen to send out an &quot;echo&quot;.</li>
          <li>The echo reveals hidden objects within its range.</li>
          <li>When an object is revealed, it&apos;s claimed by the current player and they score a point.</li>
          <li>The game ends when all hidden objects are found.</li>
          <li>The player with the most points at the end wins!</li>
        </ol>
        <h3 className="font-bold">Tips:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Listen for sound cues - different sounds play for clicks and object discoveries.</li>
          <li>Watch for visual feedback - echoes spread out from your click, and discovered objects pulse.</li>
          <li>
            Try to remember where you and your opponent have clicked to maximize your chances of finding new objects.
          </li>
        </ul>
      </div>
    </DialogContent>
  </Dialog>
);

const EchoOfSilence: React.FC = () => {
  const [echoes, setEchoes] = useState<{ x: number; y: number }[]>([]);
  const [hiddenObjects, setHiddenObjects] = useState<ObjectPosition[]>([]);
  const [turn, setTurn] = useState(1);
  const [players, setPlayers] = useState<PlayerInfo[]>([
    { name: "", score: 0 },
    { name: "", score: 0 },
  ]);
  const [gameState, setGameState] = useState<"setup" | "playing" | "over">("setup");
  const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (gameState === "playing") {
      const objects: ObjectPosition[] = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
      }));
      setHiddenObjects(objects);
      audioContext.current = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, [gameState]);

  const playSound = useCallback((frequency: number, duration: number) => {
    if (audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

      gainNode.gain.setValueAtTime(0.5, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + duration);
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (gameState !== "playing") return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setClickPosition({ x, y });
      setEchoes((prev) => [...prev, { x, y }]);
      playSound(440, 0.5); // Play a sound on click

      setHiddenObjects((prev) =>
        prev.map((obj) => {
          const distance = Math.hypot(obj.x - x, obj.y - y);
          if (distance < 15 && obj.revealedBy === undefined) {
            setPlayers((prevPlayers) =>
              prevPlayers.map((player, index) => (index + 1 === turn ? { ...player, score: player.score + 1 } : player))
            );
            playSound(880, 0.3); // Play a different sound when object is found
            return { ...obj, revealedBy: turn };
          }
          return obj;
        })
      );

      setTimeout(() => setEchoes((prev) => prev.slice(1)), 1000);
      setTimeout(() => setClickPosition(null), 1000);
      setTurn((prev) => (prev === 1 ? 2 : 1));
    },
    [turn, gameState, playSound]
  );

  useEffect(() => {
    if (gameState === "playing" && hiddenObjects.every((obj) => obj.revealedBy !== undefined)) {
      setGameState("over");
    }
  }, [hiddenObjects, gameState]);

  const handleNameChange = (index: number, name: string) => {
    setPlayers((prev) => prev.map((player, i) => (i === index ? { ...player, name } : player)));
  };

  const handleStartGame = () => {
    if (players[0].name && players[1].name) {
      setGameState("playing");
    }
  };

  const handleRestart = () => {
    setPlayers((prev) => prev.map((player) => ({ ...player, score: 0 })));
    setGameState("playing");
  };

  if (gameState === "setup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl mb-8">Echo of Silence</h1>
        {players.map((player, index) => (
          <div key={index} className="mb-4">
            <label htmlFor={`player${index + 1}`} className="block mb-2">
              Player {index + 1} Name:
            </label>
            <Input
              id={`player${index + 1}`}
              type="text"
              value={player.name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              className="text-black"
            />
          </div>
        ))}
        <div className="flex space-x-4 mt-4">
          <Button onClick={handleStartGame} disabled={!players[0].name || !players[1].name}>
            Start Game
          </Button>
          <GameInfoModal />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-gray-900 overflow-hidden cursor-crosshair" onClick={handleClick}>
      <AnimatePresence>
        {echoes.map((echo, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-blue-500 opacity-50"
            style={{ left: `${echo.x}%`, top: `${echo.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {clickPosition && (
          <motion.div
            className="absolute rounded-full border-2 border-white"
            style={{ left: `${clickPosition.x}%`, top: `${clickPosition.y}%` }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1, 1.5], opacity: [1, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hiddenObjects.map((obj) => (
          <motion.div
            key={obj.id}
            className={`absolute w-6 h-6 rounded-full ${
              obj.revealedBy === 1 ? "bg-red-500" : obj.revealedBy === 2 ? "bg-blue-500" : "bg-gray-500"
            }`}
            style={{ top: `${obj.y}%`, left: `${obj.x}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: obj.revealedBy !== undefined ? [1, 1.1, 1] : 0,
              opacity: obj.revealedBy !== undefined ? 1 : 0,
            }}
            transition={{
              duration: 0.5,
              repeat: obj.revealedBy !== undefined ? Infinity : 0,
              repeatType: "reverse",
            }}
          />
        ))}
      </AnimatePresence>

      <div className="absolute top-4 left-4 space-y-2">
        {players.map((player, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 ${index + 1 === turn ? "opacity-100" : "opacity-50"}`}
          >
            <div
              className={`w-8 h-8 rounded-full ${
                index === 0 ? "bg-red-500" : "bg-blue-500"
              } flex items-center justify-center text-white font-bold`}
            >
              {player.name[0]}
            </div>
            <span className="text-white font-bold">
              {player.name}: {player.score}
            </span>
          </div>
        ))}
      </div>

      {gameState === "over" && (
        <Alert className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg max-w-lg">
          <Camera className="h-4 w-4" />
          <AlertTitle>Game Over!</AlertTitle>
          <AlertDescription>
            {players[0].score > players[1].score
              ? `${players[0].name} wins!`
              : players[1].score > players[0].score
              ? `${players[1].name} wins!`
              : "It's a tie!"}
          </AlertDescription>
          <Button onClick={handleRestart} className="mt-4">
            Play Again
          </Button>
        </Alert>
      )}

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg">
        Click to send out an echo and reveal hidden objects!
      </div>
    </div>
  );
};

export default EchoOfSilence;
