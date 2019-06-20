import KeyEventRecordState from '../../const/KeyEventRecordState';

function stateFromEvent(event) {
  return event.simulated ? KeyEventRecordState.simulated : KeyEventRecordState.seen;
}

export default stateFromEvent;
