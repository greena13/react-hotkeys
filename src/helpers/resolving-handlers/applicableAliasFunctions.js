import resolveAltShiftedAlias from './resolveAltShiftedAlias';
import resolveUnaltShiftedAlias from './resolveUnaltShiftedAlias';
import resolveShiftedAlias from './resolveShiftedAlias';
import resolveUnshiftedAlias from './resolveUnshiftedAlias';
import resolveAltedAlias from './resolveAltedAlias';
import resolveUnaltedAlias from './resolveUnaltedAlias';

function applicableAliasFunctions(keyDictionary){
  if (keyDictionary['Shift']) {
    if (keyDictionary['Alt']) {
      return [resolveAltShiftedAlias, resolveUnaltShiftedAlias];
    }

    return [resolveShiftedAlias, resolveUnshiftedAlias];
  }

  if (keyDictionary['Alt']) {
    return [resolveAltedAlias, resolveUnaltedAlias];
  }

  return [nop, nop];
}

function nop(keyName){
  return [keyName]
}

export default applicableAliasFunctions;
