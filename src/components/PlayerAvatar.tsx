// PlayerAvatar component
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PlayerAvatarProps {
  player: number;
  score: number;
  active: boolean;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, score, active }) => (
  <div className={`flex items-center space-x-2 ${active ? "opacity-100" : "opacity-50"}`}>
    <Avatar>
      <AvatarFallback className={player === 1 ? "bg-red-500" : "bg-blue-500"}>P{player}</AvatarFallback>
    </Avatar>
    <span className="text-white font-bold">{score}</span>
  </div>
);
