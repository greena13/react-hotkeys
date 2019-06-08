/**
 * Returns the name of the event at a specified event record index
 * @param {KeyEventRecordIndex} eventRecordIndex
 * @returns {KeyEventName} Name of the key event
 */
function describeKeyEventType(eventRecordIndex) {
  switch(parseInt(eventRecordIndex, 10)) {
    case 0: return 'keydown';
    case 1: return 'keypress';
    default: return 'keyup';
  }
}

export default describeKeyEventType;
