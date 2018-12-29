import ignoreEventsCondition from '../helpers/ignoreEventsCondition';
import dictionaryFrom from '../utils/object/dictionaryFrom';

let _configuration = {
  logLevel: 'warn',

  defaultKeyEvent: 'keypress',

  defaultComponent: 'div',

  defaultTabIndex: '-1',

  ignoreTags: ['input', 'select', 'textarea'],

  simulateMissingKeyPressEvents: true,

  ignoreEventsCondition
};

_configuration._ignoreTagsDict = dictionaryFrom(_configuration.ignoreTags, true);

class Configuration {
  static init(configuration) {
    const { ignoreTags } = configuration;

    if (ignoreTags) {
      configuration._ignoreTagsDict = dictionaryFrom(configuration.ignoreTags);
    }

    Object.keys(configuration).forEach((key) => {
      this.set(key, configuration[key])
    })
  }

  static set(key, value) {
    _configuration[key] = value;
  }

  static option(key) {
    return _configuration[key];
  }
}

export default Configuration;
