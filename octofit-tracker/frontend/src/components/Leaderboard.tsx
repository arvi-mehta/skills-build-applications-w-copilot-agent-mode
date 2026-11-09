import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };
const loadLeaderboard = (path: string) => getJson<LeaderboardResponse>(path);

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      load={loadLeaderboard}
      emptyText="No leaderboard rankings yet."
      isEmpty={({ leaderboard }) => leaderboard.length === 0}
      render={({ leaderboard }) => (
        <ol className="list-group list-group-numbered" aria-label="Team rankings">
          {leaderboard.map((entry) => (
            <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
              <span>{entry.teamName}</span>
              <span>{entry.totalPoints} points</span>
            </li>
          ))}
        </ol>
      )}
    />
  );
}
