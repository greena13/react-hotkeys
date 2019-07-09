import capitalize from './capitalize';

function normalizeEventName(eventName) {
  return `${capitalize(eventName.slice(0,3))}${capitalize(eventName.slice(3))}`;
}

export default normalizeEventName;
