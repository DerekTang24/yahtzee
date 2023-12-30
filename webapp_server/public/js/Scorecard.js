class Scorecard {
  constructor(category_elements, score_elements, myDice) {
    this.category_elements = category_elements;
    this.dice = myDice;
    this.score_elements = score_elements;
  }

  /**
   * Determines whether the scorecard is full/finished
   * A full scorecard is a scorecard where all categores are disabled.
   *
   * @return {Boolean} a Boolean value indicating whether the scorecard is full
   */
  is_finished() {}

  /**
   * Validates a score for a particular category
   * Upper categories should be validated by a single generalized procedure
   * Hint: Make use of this.dice.get_sum() and this.dice.get_counts()
   *
   * @param {String} category the category that should be validated
   * @param {Number} value the proposed score for the category
   *
   * @return {Boolean} a Boolean value indicating whether the score is valid for the category
   */
  is_valid_score(category, value) {}

  /**
   * Returns the current Grand Total score for a scorecard
   *
   * @return {Number} an integer value representing the curent game score
   */
  get_score() {}

  /**
   * Updates all score elements for a scorecard
   */
  update_scores() {}

  /**
     * Loads a scorecard from a JS object in the specified format
     * Format:
     * {
            "dice_rolls":0,
            "upper":{
                "ones":-1,
                "twos":-1,
                "threes":-1,
                "fours":-1,
                "fives":-1,
                "sixes":-1
            },
            "lower":{
                "three_of_a_kind":-1,
                "four_of_a_kind":-1,
                "full_house":-1,
                "small_straight":-1,
                "large_straight":-1,
                "yahtzee":-1,
                "chance":-1
            }
        }
     *
     * @param {Object} gameObject the object version of the scorecard
    */
  load_scorecard(score_info) {}

  /**
     * Creates a JS object from the scorecard in the specified format
     * Useful for preparing a scorecard to send to the webapp server
     * 
     * Format:
     * {
            "dice_rolls":0,
            "upper":{
                "ones":-1,
                "twos":-1,
                "threes":-1,
                "fours":-1,
                "fives":-1,
                "sixes":-1
            },
            "lower":{
                "three_of_a_kind":-1,
                "four_of_a_kind":-1,
                "full_house":-1,
                "small_straight":-1,
                "large_straight":-1,
                "yahtzee":-1,
                "chance":-1
            }
        }
     *
     * @return {Object} an object version of the scorecard
     *
     */
  to_object() {
    this.category_elements.array.forEach((element) => {
      
    });
  }
}

export default Scorecard;
