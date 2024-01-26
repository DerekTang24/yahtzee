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
  is_finished() {
    for (const element of this.category_elements) {
      if (!element.disabled) {
        return false;
      }
    }
    return true;
  }

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
  is_valid_score(category, value) {
    if (this.dice.get_sum() === 0) {
      return false;
    } else if (value === 0) {
      return true;
    }
    const type = category.id.slice(0, -6);
    const uppers = ["one", "two", "three", "four", "five", "six"];
    const dice_counts = this.dice.get_counts();
    if (uppers.includes(type)) {
      const number_index = uppers.indexOf(type);
      return value === dice_counts[number_index] * (number_index + 1);
    }
    switch (type) {
      case "three_of_a_kind":
        return Math.max(...dice_counts) >= 3 && value === this.dice.get_sum();
      case "four_of_a_kind":
        return Math.max(...dice_counts) >= 4 && value === this.dice.get_sum();
      case "full_house":
        let three = false;
        let two = false;
        for (const val of dice_counts) {
          if (val === 2) two = true;
          else if (val === 3) three = true;
        }
        return two && three && value === 25;
      case "small_straight":
        if (value !== 30) {
          return false;
        }
        if (
          dice_counts.slice(0, 4).every((e) => e > 0) ||
          dice_counts.slice(1, 5).every((e) => e > 0) ||
          dice_counts.slice(2, 6).every((e) => e > 0)
        ) {
          return true;
        } else {
          return false;
        }
      case "large_straight":
        if (value !== 40) {
          return false;
        }
        if (
          dice_counts.slice(0, 5).every((e) => e > 0) ||
          dice_counts.slice(1, 6).every((e) => e > 0)
        ) {
          return true;
        } else {
          return false;
        }
      case "yahtzee":
        return Math.max(...dice_counts) === 5 && value === 50;
      case "chance":
        return value === this.dice.get_sum();
    }
  }

  /**
   * Returns the current Grand Total score for a scorecard
   *
   * @return {Number} an integer value representing the curent game score
   */
  get_score() {
    this.update_scores();
    return parseInt(this.score_elements[5].innerHTML);
  }

  /**
   * Updates all score elements for a scorecard
   */
  update_scores(user_id) {
    const category_elements = this.category_elements.filter(
      (element) => parseInt(element.getAttribute("user_id")) === user_id
    );
    const score_elements = this.score_elements.filter(
      (element) => parseInt(element.getAttribute("user_id")) === user_id
    );
    const upper_score = category_elements
      .filter(
        (element) => element.classList.contains("upper") && element.disabled
      )
      .map((element) => element.value)
      .reduce((partialSum, a) => partialSum + parseInt(a), 0);
    const upper_bonus = upper_score >= 63;
    const upper_total = upper_bonus ? upper_score + 35 : upper_score;

    const lower_total = category_elements
      .filter(
        (element) => element.classList.contains("lower") && element.disabled
      )
      .map((element) => element.value)
      .reduce((partialSum, a) => partialSum + parseInt(a), 0);

    console.log(score_elements);
    score_elements[0].innerHTML = upper_score;
    score_elements[1].innerHTML = upper_bonus ? 35 : "";
    score_elements[2].innerHTML = upper_total;
    score_elements[3].innerHTML = lower_total;
    score_elements[4].innerHTML = upper_total;
    score_elements[5].innerHTML = upper_total + lower_total;
  }

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
  load_scorecard(score_info, user_id) {
    this.dice.rolls_remaining_element.innerHTML = score_info.dice_rolls;
    const scores = {
      ...score_info.upper,
      ...score_info.lower,
    };
    const category_elements = this.category_elements.filter(
      (element) => parseInt(element.getAttribute("user_id")) === user_id
    );
    category_elements.forEach((element) => {
      const raw_id = element.id.slice(0, -6);
      //because the score_info format doesn't match the score_elements' ids
      const id = element.classList.contains("upper")
        ? raw_id === "six"
          ? "sixes"
          : raw_id + "s"
        : raw_id;
      const val = scores[id];
      if (val === -1) {
        element.value = "";
        element.disabled = false;
      } else {
        element.value = val;
        element.disabled = true;
      }
    });
    this.update_scores(user_id);
  }

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
  to_object(user_id) {
    const dice_rolls = this.dice.rolls_remaining_element.innerHTML;
    const category_elements = this.category_elements.filter(
      (element) => parseInt(element.getAttribute("user_id")) === user_id
    );
    const upper = {};
    const lower = {};
    category_elements.forEach((element) => {
      const raw_id = element.id.slice(0, -6);
      if (element.classList.contains("upper")) {
        const id = raw_id === "six" ? "sixes" : raw_id + "s";
        upper[id] = element.disabled ? parseInt(element.value) : -1;
      } else {
        lower[raw_id] = element.disabled ? parseInt(element.value) : -1;
      }
    });
    return {
      dice_rolls,
      upper,
      lower,
    };
  }
}

export default Scorecard;
