import describeKeyEventType from './describeKeyEventType';

function describeKeyEvent(event, keyName, keyEventType) {
  const eventDescription = `'${keyName}' ${describeKeyEventType(keyEventType)}`;

  if (event.simulated) {
    return `(simulated) ${eventDescription}`;
  }

  return eventDescription;
}

export default describeKeyEvent;
