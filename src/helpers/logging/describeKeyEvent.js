import describeKeyEventType from './describeKeyEventType';

function describeKeyEvent(event, keyName, keyEventRecordIndex) {
  const eventDescription = `'${keyName}' ${describeKeyEventType(keyEventRecordIndex)}`;

  if (event.simulated) {
    return `(simulated) ${eventDescription}`;
  }

  return eventDescription;
}

export default describeKeyEvent;
