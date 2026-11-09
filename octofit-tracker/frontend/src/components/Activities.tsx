import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };
const loadActivities = (path: string) => getJson<ActivityResponse>(path);

export default function Activities() {
  return (
    <CapabilityCard<ActivityResponse>
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      load={loadActivities}
      emptyText="No activities yet."
      isEmpty={({ activities }) => activities.length === 0}
      render={({ activities }) => (
        <ul className="list-group list-group-flush" aria-label="Activity records">
          {activities.map((activity, index) => (
            <li className="list-group-item d-flex justify-content-between" key={activity._id ?? index}>
              <span className="text-capitalize">{activity.type}</span>
              <span>{activity.minutes} min, {activity.points} points</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
