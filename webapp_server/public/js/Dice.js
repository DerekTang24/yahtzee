console.log("Dice.js connected");
class Dice {
  constructor(dice_elements, rolls_remaining_element) {
    this.rolls_remaining_element = rolls_remaining_element;
    this.dice_elements = dice_elements;
    this.photo_names = ["blank", "one", "two", "three", "four", "five", "six"];
  }

  /**
   * Returns the number of rolls remaining for a turn
   * @return {Number} an integer representing the number of rolls remaining for a turn
   */
  get_rolls_remaining() {
    return parseInt(this.rolls_remaining_element.innerHTML);
  }

  /**
   * Returns a copy of the array of integers representing
   * a current view of all five Yahtzee dice_elements
   * <br> A natural mapping is used to pair each integer with a die picture
   * <br> 0 is used to represent a "blank" die picture
   *
   * @return {Array} an array of integers representing dice values of dice pictures
   */
  get_values() {
    return this.dice_elements.map((element) => {
      return this.photo_names.indexOf(element.getAttribute("src").slice(8, -4));
    });
  }

  /**
   * Calculates the sum of all dice_elements
   * <br> Returns 0 if the dice are blank
   *
   * @return {Number} an integer represenitng the sum of all five dice
   */
  get_sum() {
    return this.get_values().reduce((partialSum, a) => partialSum + a, 0);
  }

  /**
   * Calculates a count of each die face in dice_elements
   * <br> Ex - would return [0, 0, 0, 0, 2, 3] for two fives and three sixes
   *
   * @return {Array} an array of six integers representing counts of the six die faces
   */
  get_counts() {
    const arr = [0, 0, 0, 0, 0, 0];
    this.get_values().forEach((element) => {
      arr[element - 1]++;
    });
    return arr;
  }

  /**
   * Performs all necessary actions to roll and update display of dice_elements
   * Also updates rolls remaining
   * <br> Uses this.set to update dice
   */
  roll() {
    const values = [...this.get_values()];
    this.dice_elements.forEach((element, index) => {
      if (element.classList.contains("reserved")) {
        values[index] = -1;
      } else {
        values[index] = Math.floor(Math.random() * 6 + 1);
      }
    });
    this.set(values, this.get_rolls_remaining() - 1);
  }

  /**
   * Resets all dice_element pictures to blank, and unreserved
   * <br> Uses this.#setDice to update dice
   */
  reset() {
    this.dice_elements.forEach((element) =>
      element.classList.remove("resersved")
    );
    this.set([0, 0, 0, 0, 0], 3);
    return;
  }

  /**
   * Performs all necessary actions to reserve/unreserve a particular die
   * <br> Adds "reserved" as a class label to indicate a die is reserved
   * <br> Removes "reserved" a class label if a die is already reserved
   * <br> Hint: use the classlist.toggle method
   *
   * @param {Object} element the <img> element representing the die to reserve
   */
  reserve(die_element) {
    if (
      this.get_rolls_remaining() !== 0 &&
      die_element.getAttribute("src") !== "/images/blank.svg"
    ) {
      die_element.classList.toggle("reserved");
    }
    return;
  }

  /**
   * A useful testing method to conveniently change dice / rolls remaining
   * <br> A value of 0 indicates that the die should be blank
   * <br> A value of -1 indicates that the die is reserved and should not be updated
   *
   * @param {Array} new_dice_values an array of five integers, one for each die value
   * @param {Number} new_rolls_remaining an integer representing the new value for rolls remaining
   *
   */
  set(new_dice_values, new_rolls_remaining) {
    this.dice_elements.forEach((element, index) => {
      if (new_dice_values[index] !== -1) {
        element.src = `/images/${this.photo_names[new_dice_values[index]]}.svg`;
      }
    });
    this.rolls_remaining_element.innerHTML = new_rolls_remaining;
    return;
  }
}

export default Dice;
