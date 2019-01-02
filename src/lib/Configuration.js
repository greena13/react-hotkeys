import ignoreEventsCondition from '../helpers/resolving-handlers/ignoreEventsCondition';
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

    if(process.env.NODE_ENV === 'production') {
      if (['verbose', 'debug', 'info'].indexOf(configuration.logLevel) !== -1) {
        console.warn(
          `React HotKeys: You have requested log level '${configuration.logLevel}' but for performance reasons, logging below severity level 'warning' is disabled in production. Please use the development build for complete logs.`
        )
      }
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
