/**
 * @typedef {number} EventResponseType
 */

/**
 * Enum for different ways to respond to a key event
 * @readonly
 * @enum {EventResponseType}
 */
const EventResponse = {
  unseen: 0,
  ignored: 1,
  seen: 2,
  recorded: 3,
  handled: 4
};

export default EventResponse;
