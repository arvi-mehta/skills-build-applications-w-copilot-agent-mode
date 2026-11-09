import { CapabilityCard } from './CapabilityCard.js';

type Workout = {
  _id?: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutsResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      emptyText="No workout suggestions yet."
      isEmpty={({ suggestions }) => suggestions.length === 0}
      render={({ suggestions }) => (
        <ul className="list-group list-group-flush" aria-label="Workout suggestions">
          {suggestions.map((workout, index) => (
            <li className="list-group-item" key={workout._id ?? workout.title ?? index}>
              <h3 className="h5">{workout.title}</h3>
              <p>{workout.reason}</p>
              <p className="mb-0">{workout.focus}, {workout.minutes} min, {workout.difficulty}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
