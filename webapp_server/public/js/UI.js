console.log("UI.js connected");
import Dice from "./Dice.js";
//import Scorecard from './Scorecard.js';

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
//let scorecard = new Scorecard(category_elements, score_elements, dice);
//window.scorecard = scorecard;

//---------Event Handlers-------//
function reserve_die_handler(event) {
  console.log("Trying to reserve " + event.target.id);
}

function roll_dice_handler() {
  display_feedback("Rolling the dice...", "good");
  dice.roll();

  console.log("Dice values:", dice.get_values());
  console.log("Sum of all dice:", dice.get_sum());
  console.log("Count of all dice faces:", dice.get_counts());
}

function enter_score_handler(event) {
  console.log("Score entry attempted for: ", event.target.id);
}

//------Feedback ---------//
function display_feedback(message, context) {}
