console.log("UI.js connected");
import Dice from "./Dice.js";
import Scorecard from "./Scorecard.js";
const feedback = document.getElementById("feedback");

//-------Dice Setup--------//
let roll_button = document.getElementById("roll_button");
roll_button.addEventListener("click", roll_dice_handler);

let rolls_remainging_element = document.getElementById("rolls_remaining");
let dice_elements = [];
for (let i = 0; i < 5; i++) {
  let die = document.getElementById("die_" + i);
  die.addEventListener("dblclick", reserve_die_handler);
  dice_elements.push(die);
}
let dice = new Dice(dice_elements, rolls_remainging_element);
window.dice = dice;

//-----Scorecard Setup---------//
let category_elements = Array.from(document.getElementsByClassName("category"));
for (let category of category_elements) {
  category.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      enter_score_handler(event);
    }
  });
}
let score_elements = Array.from(document.getElementsByClassName("score"));
const scorecard = new Scorecard(category_elements, score_elements, dice);
window.scorecard = scorecard;
scorecard.update_scores();

//---------Event Handlers-------//
function reserve_die_handler(event) {
  console.log("Trying to reserve " + event.target.id);
  if (event.target.src.indexOf("blank") !== -1) {
    display_feedback("Cannot reserve blank die", "bad");
  } else if (dice.get_rolls_remaining() === 0) {
    display_feedback("Cannot reserve die without rolls remaining", "bad");
  } else {
    dice.reserve(event.target);
    display_feedback("Reserved die", "good");
  }
}

function roll_dice_handler() {
  if (dice.get_rolls_remaining() > 0) {
    display_feedback("Rolling the dice...", "good");
    dice.roll();
  } else {
    display_feedback("Out of rolls", "bad");
  }

  console.log("Dice values:", dice.get_values());
  console.log("Sum of all dice:", dice.get_sum());
  console.log("Count of all dice faces:", dice.get_counts());
}

async function enter_score_handler(event) {
  console.log("Score entry attempted for: ", event.target.id);
  if (scorecard.is_valid_score(event.target, parseInt(event.target.value))) {
    event.target.disabled = true;
    scorecard.update_scores();
    dice.reset();
    dice_elements.forEach((e) => e.classList.remove("reserved"));
    display_feedback("Valid entry", "good");

    const scorecard_id = document
      .getElementById("scorecard")
      .getAttribute("scorecard_id");
    const url = "/scorecards/" + scorecard_id;
    const headers = {
      "Content-Type": "application/json",
    };
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(scorecard.to_object()),
    });
    console.log("here", scorecard.to_object(), res);
    dice_elements.forEach((e) => e.classList.remove("reserved"));
  } else {
    display_feedback("Invalid entry", "bad");
  }
}

//------Feedback ---------//
function display_feedback(message, context) {
  feedback.innerHTML = message;
  feedback.classList.remove("good");
  feedback.classList.remove("bad");
  feedback.classList.add(context);
}
