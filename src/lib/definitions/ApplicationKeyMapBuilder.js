import isObject from '../../utils/object/isObject';
import hasKey from '../../utils/object/hasKey';
import copyAttributes from '../../utils/object/copyAttributes';
import arrayFrom from '../../utils/array/arrayFrom';

const SEQUENCE_ATTRIBUTES = ['sequence', 'action'];
const KEYMAP_ATTRIBUTES = ['name', 'description', 'group'];

function createSequenceFromConfig(keyMapConfig) {
  return arrayFrom(keyMapConfig).map((sequenceOrKeyMapOptions) => {
    if (isObject(sequenceOrKeyMapOptions)) {
      /**
       * Support syntax:
       * [
       *   { sequence: 'a+b', action: 'keyup' },
       *   { sequence: 'c' }
       * ]
       */
      return copyAttributes(sequenceOrKeyMapOptions, {}, SEQUENCE_ATTRIBUTES);
    } else {
      /**
       * Support syntax:
       * 'a+b'
       */
      return { sequence: sequenceOrKeyMapOptions };
    }
  })
}

function normalizeActionDefinition(keyMap, actionName, keyMapSummary) {
  const keyMapConfig = keyMap[actionName];

  keyMapSummary[actionName] = {};

  if (isObject(keyMapConfig)) {
    if (hasKey(keyMapConfig, 'sequences')) {
      /**
       * Support syntax:
       *  {
       *    sequences: [ {sequence: 'a+b', action: 'keyup' }],
       *    name: 'My keymap',
       *    description: 'Key to press for something special',
       *    group: 'Vanity'
       *  }
       */
      copyAttributes(
        keyMapConfig,
        keyMapSummary[actionName],
        KEYMAP_ATTRIBUTES
      );

      keyMapSummary[actionName].sequences =
        createSequenceFromConfig(keyMapConfig.sequences);
    } else {
      /**
       * Support syntax:
       * {
       *   sequence: 'a+b', action: 'keyup',
       *   name: 'My keymap',
       *   description: 'Key to press for something special',
       *   group: 'Vanity'
       * }
       */
      copyAttributes(keyMapConfig, keyMapSummary[actionName], KEYMAP_ATTRIBUTES);

      keyMapSummary[actionName].sequences = [
        copyAttributes(keyMapConfig, {}, SEQUENCE_ATTRIBUTES)
      ];
    }
  } else {
    keyMapSummary[actionName].sequences =
      createSequenceFromConfig(keyMapConfig);
  }
}

class ApplicationKeyMapBuilder {
  constructor(componentTree) {
    this._componentTree = componentTree;
  }

  build() {
    if (!this._componentTree.hasRoot()) {
      return {};
    }

    return this._build([this._componentTree.rootId], {});
  }

  _build(componentIds, keyMapSummary) {
    componentIds.forEach((componentId) => {
      const { childIds, keyMap } = this._componentTree.get(componentId);

      if (keyMap) {
        Object.keys(keyMap).forEach((actionName) => {
          normalizeActionDefinition(keyMap, actionName, keyMapSummary);
        });
      }

      this._build(childIds, keyMapSummary);
    });

    return keyMapSummary;
  }
}

export default ApplicationKeyMapBuilder;
