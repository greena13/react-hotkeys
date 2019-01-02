import isUndefined from '../utils/isUndefined';

function isFromFocusOnlyComponent(focusTreeId){
  return !isUndefined(focusTreeId);
}

export default isFromFocusOnlyComponent;
