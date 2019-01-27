import describeKeyEventType from './describeKeyEventType';

function describeKeyEvent(event, keyName, keyEventBitmapIndex) {
  const eventDescription = `'${keyName}' ${describeKeyEventType(keyEventBitmapIndex)}`;

  if (event.simulated) {
    return `(simulated) ${eventDescription}`;
  }

  return eventDescription;
}

export default describeKeyEvent;
