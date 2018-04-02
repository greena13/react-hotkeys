/**
 * @typedef {boolean[]} KeyEventBitmap A bitmap indicating which of the key events
 * have been registered to a particular key. The first bit is for the keydown event,
 * the second keypress and the third is for keyup.
 *
 * @example: A bitmap for an key that has seen the keydown and keypress event, but not
 * the keyup event
 *
 * [true,true,false]
 */

/**
 * Creates and modifies KeyEventBitmaps
 * @class
 */
class KeyEventBitmapManager {
  /**
   * Makes a new KeyEventBitmap with one of the bits set to true
   * @param {KeyEventBitmapIndex} eventBitmapIndex Index of bit to set to true
   * @returns {KeyEventBitmap} New key event bitmap with bit set to true
   */
  static newBitmap(eventBitmapIndex) {
    const bitmap = [ false, false, false ];
    bitmap[eventBitmapIndex] = true;

    return bitmap;
  }

  /**
   * Sets a bit in the map to true
   * @param {KeyEventBitmap} bitmap Map to set a bit to true
   * @param {KeyEventBitmapIndex} index Index of bit to set
   */
  static setBit(bitmap, index) {
    bitmap[index] = true;
  }
}

export default KeyEventBitmapManager;
