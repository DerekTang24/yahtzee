const puppeteer = require("puppeteer");
const tools = require("./util");
const fetch = require("node-fetch");

let url_base = "http://127.0.0.1:3000";
let num_games_per_user = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function enterCategory(page, dice_values, category_id, score) {
  await page.evaluate(
    (dice_values, category_id, score) => {
      window.dice.set(dice_values, 2);
      document.getElementById(category_id).value = score;
    },
    dice_values,
    category_id,
    score
  );

  await page.focus(`input[id="${category_id}"]`);
  await page.keyboard.press("Enter");
}
let score_info_finished = {
  dice_rolls: 0,
  upper: {
    ones: 4,
    twos: 8,
    threes: 12,
    fours: 16,
    fives: 20,
    sixes: 24,
  },
  lower: {
    three_of_a_kind: 20,
    four_of_a_kind: 26,
    full_house: 25,
    small_straight: 0,
    large_straight: 40,
    yahtzee: 50,
    chance: 8,
  },
};
let score_info_finished_no_bonus = {
  dice_rolls: 0,
  upper: {
    ones: 4,
    twos: 8,
    threes: 12,
    fours: 16,
    fives: 20,
    sixes: 0,
  },
  lower: {
    three_of_a_kind: 20,
    four_of_a_kind: 26,
    full_house: 0,
    small_straight: 0,
    large_straight: 40,
    yahtzee: 50,
    chance: 8,
  },
};
let score_info_partial = {
  dice_rolls: 2,
  upper: {
    ones: 4,
    twos: 8,
    threes: -1,
    fours: -1,
    fives: -1,
    sixes: 24,
  },
  lower: {
    three_of_a_kind: -1,
    four_of_a_kind: 26,
    full_house: -1,
    small_straight: 0,
    large_straight: 40,
    yahtzee: 0,
    chance: 8,
  },
};
let score_info_partial_bonus = {
  dice_rolls: 2,
  upper: {
    ones: 4,
    twos: 8,
    threes: 12,
    fours: 16,
    fives: 20,
    sixes: 24,
  },
  lower: {
    three_of_a_kind: -1,
    four_of_a_kind: 26,
    full_house: -1,
    small_straight: 0,
    large_straight: 40,
    yahtzee: 0,
    chance: 8,
  },
};
async function get_all_scorecard_values(page) {
  let all_scorecard_values = {};

  all_scorecard_values["rolls_remaining"] = await page.evaluate(
    'document.getElementById("rolls_remaining").innerHTML'
  );
  all_scorecard_values["one"] = await page.evaluate(
    'document.getElementById("one_input").value'
  );
  all_scorecard_values["two"] = await page.evaluate(
    'document.getElementById("two_input").value'
  );
  all_scorecard_values["three"] = await page.evaluate(
    'document.getElementById("three_input").value'
  );
  all_scorecard_values["four"] = await page.evaluate(
    'document.getElementById("four_input").value'
  );
  all_scorecard_values["five"] = await page.evaluate(
    'document.getElementById("five_input").value'
  );
  all_scorecard_values["six"] = await page.evaluate(
    'document.getElementById("six_input").value'
  );
  all_scorecard_values["three_of_a_kind"] = await page.evaluate(
    'document.getElementById("three_of_a_kind_input").value'
  );
  all_scorecard_values["four_of_a_kind"] = await page.evaluate(
    'document.getElementById("four_of_a_kind_input").value'
  );
  all_scorecard_values["full_house"] = await page.evaluate(
    'document.getElementById("full_house_input").value'
  );
  all_scorecard_values["small_straight"] = await page.evaluate(
    'document.getElementById("small_straight_input").value'
  );
  all_scorecard_values["large_straight"] = await page.evaluate(
    'document.getElementById("large_straight_input").value'
  );
  all_scorecard_values["yahtzee"] = await page.evaluate(
    'document.getElementById("yahtzee_input").value'
  );
  all_scorecard_values["chance"] = await page.evaluate(
    'document.getElementById("chance_input").value'
  );

  return all_scorecard_values;
}

async function get_all_score_values(page) {
  let all_score_values = {};
  all_score_values["upper_score"] = await page.evaluate(
    'document.getElementById("upper_score").innerHTML'
  );
  all_score_values["upper_bonus"] = await page.evaluate(
    'document.getElementById("upper_bonus").innerHTML'
  );
  all_score_values["upper_total"] = await page.evaluate(
    'document.getElementById("upper_total").innerHTML'
  );
  all_score_values["upper_total_lower"] = await page.evaluate(
    'document.getElementById("upper_total_lower").innerHTML'
  );
  all_score_values["lower_score"] = await page.evaluate(
    'document.getElementById("lower_score").innerHTML'
  );
  all_score_values["grand_total"] = await page.evaluate(
    'document.getElementById("grand_total").innerHTML'
  );
  return all_score_values;
}

describe("Scorecard", () => {
  let browser;
  let page;
  let users;
  let game_names;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    await tools.delete_all_scorecards_from_DB();
    await tools.delete_all_games_from_DB();
    await tools.delete_all_users_from_DB();

    users = await tools.add_users_to_DB(4);
    game_names = await tools.add_1_player_games(users, num_games_per_user);
  });

  beforeEach(async () => {
    page = await browser.newPage();
    let game_name = users[0]["username"] + "game1";
    let username = users[0]["username"];
    await page.goto(url_base + "/games/" + game_name + "/" + username, {
      waitUntil: "domcontentloaded",
    });
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
    await tools.delete_all_scorecards_from_DB();
    await tools.delete_all_games_from_DB();
    await tools.delete_all_users_from_DB();
  });

  describe("1) UI - Dice Feedback Tests", () => {
    it("1.1: .good feedback should be displayed on a valid roll attempt", async () => {
      const rollButton = await page.$("#roll_button");
      await rollButton.click(); //roll #1
      await sleep(1100);

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(true);
      expect(feedback_bad).toBe(false);
    });
    it("1.2: .bad feedback should be displayed when attempting to roll the dice w/out rolls remaining", async () => {
      const rollButton = await page.$("#roll_button");
      await rollButton.click(); //roll #1
      await sleep(1100);
      await rollButton.click(); //roll #2
      await sleep(1100);
      await rollButton.click();
      await sleep(1100); //roll #3
      await rollButton.click(); //roll attempt #4
      await sleep(1100);

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(false);
      expect(feedback_bad).toBe(true);
    });
    it("1.3: .bad feedback should be displayed when attempting to reserve a blank die", async () => {
      let die = await page.$("#die_" + 2);
      await die.click({
        clickCount: 2,
      });

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(false);
      expect(feedback_bad).toBe(true);
    });
    it("1.4: .bad feedback should be displayed when attempting to reserve w/out rolls remaining", async () => {
      const rollButton = await page.$("#roll_button");
      await rollButton.click(); //roll #1
      await sleep(1100);
      await rollButton.click(); //roll #2
      await sleep(1100);
      await rollButton.click();
      await sleep(1100); //roll #3
      await rollButton.click(); //roll attempt #4
      await sleep(1100);

      let die = await page.$("#die_" + 3);
      await die.click({
        clickCount: 2,
      });

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(false);
      expect(feedback_bad).toBe(true);
    });
  });
  describe("2) UI - Scorecard Feedback Tests", () => {
    it("2.1: .good feedback should be displayed on a valid score entry", async () => {
      await enterCategory(page, [1, 2, 3, 4, 5], "one_input", 1); //valid

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(true);
      expect(feedback_bad).toBe(false);
    });
    it("2.2: .bad feedback should be displayed on an invalid score entry ", async () => {
      await enterCategory(page, [1, 2, 6, 4, 5], "two_input", 4); //invalid

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(false);
      expect(feedback_bad).toBe(true);
    });
    it("2.3: .bad feedback for score entry w/ blank dice", async () => {
      await enterCategory(page, [0, 0, 0, 0, 0], "large_straight_input", 40); //invalid

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(false);
      expect(feedback_bad).toBe(true);
    });
    it("2.4: .good feedback should be displayed on a completed scorecard", async () => {
      /*let score_info_partial_bonus={
          "dice_rolls":2,
          "upper":{
              "ones":4,
              "twos":8,
              "threes":12,
              "fours":16,
              "fives":20,
              "sixes":24
          },
          "lower":{
              "three_of_a_kind":-1,
              "four_of_a_kind":26,
              "full_house":-1,
              "small_straight":0,
              "large_straight":40,
              "yahtzee":0,
              "chance":8
          }
        }*/

      let game_name = users[3]["username"] + "game1";
      let username = users[3]["username"];
      await page.goto(url_base + "/games/" + game_name + "/" + username, {
        waitUntil: "domcontentloaded",
      });
      await page.evaluate((score_info_partial_bonus) => {
        window.scorecard.load_scorecard(score_info_partial_bonus);
      }, score_info_partial_bonus);
      await enterCategory(page, [3, 3, 3, 4, 4], "three_of_a_kind_input", 17); //valid
      await enterCategory(page, [3, 3, 3, 4, 4], "full_house_input", 25); //valid

      let feedback = await page.evaluate(
        'document.getElementById("feedback").innerHTML;'
      );
      expect(feedback.length).toBeGreaterThan(10);
      let feedback_good = await page.evaluate(
        'document.getElementById("feedback").classList.contains("good")'
      );
      let feedback_bad = await page.evaluate(
        'document.getElementById("feedback").classList.contains("bad")'
      );
      expect(feedback_good).toBe(true);
      expect(feedback_bad).toBe(false);
    });
  });
  describe("3) UI - Score Entry Tests", () => {
    it("3.1:  A valid score entry should result in a disabled category", async () => {
      await enterCategory(page, [1, 2, 3, 4, 5], "large_straight_input", 40);
      let isDisabled = await page.evaluate(
        `document.getElementById("large_straight_input").disabled;`
      );
      expect(isDisabled).toBe(true);
    });
    it("3.2:  A valid score entry should result in dice reset", async () => {
      await enterCategory(page, [1, 2, 3, 4, 5], "small_straight_input", 30);

      let die0 = await page.evaluate(
        'document.getElementById("die_0").getAttribute("src")'
      );
      let die1 = await page.evaluate(
        'document.getElementById("die_1").getAttribute("src")'
      );
      let die2 = await page.evaluate(
        'document.getElementById("die_2").getAttribute("src")'
      );
      let die3 = await page.evaluate(
        'document.getElementById("die_3").getAttribute("src")'
      );
      let die4 = await page.evaluate(
        'document.getElementById("die_4").getAttribute("src")'
      );
      expect(die0.indexOf("blank")).toBeGreaterThan(-1);
      expect(die1.indexOf("blank")).toBeGreaterThan(-1);
      expect(die2.indexOf("blank")).toBeGreaterThan(-1);
      expect(die3.indexOf("blank")).toBeGreaterThan(-1);
      expect(die4.indexOf("blank")).toBeGreaterThan(-1);
      let rolls_remaining = await page.evaluate(
        'parseInt(document.getElementById("rolls_remaining").innerHTML)'
      );
      expect(rolls_remaining).toBe(3);
    });
    it("3.3:  An invalid score entry should not result in a disabled category", async () => {
      await enterCategory(page, [1, 2, 6, 4, 5], "yahtzee_input", 40);

      let isDisabled = await page.evaluate(
        `document.getElementById("yahtzee_input").disabled;`
      );
      expect(isDisabled).toBe(false);
    });
    it("3.4:  An invalid score entry should not result in dice reset", async () => {
      await enterCategory(page, [1, 2, 6, 4, 5], "large_straight_input", 40);

      let die0 = await page.evaluate(
        'document.getElementById("die_0").getAttribute("src")'
      );
      let die1 = await page.evaluate(
        'document.getElementById("die_1").getAttribute("src")'
      );
      let die2 = await page.evaluate(
        'document.getElementById("die_2").getAttribute("src")'
      );
      let die3 = await page.evaluate(
        'document.getElementById("die_3").getAttribute("src")'
      );
      let die4 = await page.evaluate(
        'document.getElementById("die_4").getAttribute("src")'
      );
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);
      let rolls_remaining = await page.evaluate(
        'parseInt(document.getElementById("rolls_remaining").innerHTML)'
      );
      expect(rolls_remaining).toBe(2);
    });
  });

  describe("4) Roll Count Tests", () => {
    it("4.1: Roll count should decrease roll count by 1 after a roll", async () => {
      const rollButton = await page.$("#roll_button");
      let rollsRemaining1 = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rollsRemaining1).toBe(3);

      await rollButton.click();
      await sleep(1100);
      let rollsRemaining2 = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rollsRemaining2).toBe(rollsRemaining1 - 1);

      await rollButton.click();
      await sleep(1100);
      let rollsRemaining3 = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rollsRemaining3).toBe(rollsRemaining1 - 2);

      await rollButton.click();
      await sleep(1100);
      let rollsRemaining4 = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rollsRemaining4).toBe(rollsRemaining1 - 3);
    });
    it("4.2: Roll count shouldn't allow more than three rolls per turn", async () => {
      const rollButton = await page.$("#roll_button");
      await rollButton.click(); //roll #1
      await sleep(1100);
      const dice_values = await page.evaluate("window.dice.get_values();");
      await rollButton.click(); //roll #2
      await sleep(1100);
      await rollButton.click();
      await sleep(1100); //roll #3
      const dice_values_before = await page.evaluate(
        "window.dice.get_values();"
      );
      await rollButton.click(); //roll attempt #4
      await sleep(1100);
      const dice_values_after = await page.evaluate(
        "window.dice.get_values();"
      );
      expect(dice_values_before.toString()).toBe(dice_values_after.toString());
      await rollButton.click(); //roll attempt #4
      await sleep(1100);
      const dice_values_after2 = await page.evaluate(
        "window.dice.get_values();"
      );
      expect(dice_values_before.toString()).toBe(dice_values_after2.toString());
    });
    it("4.3: Roll count shouldn't decrease past 0", async () => {
      const rollButton = await page.$("#roll_button");
      await rollButton.click(); //roll #1
      await sleep(1100);
      await rollButton.click(); //roll #2
      await sleep(1100);
      await rollButton.click();
      await sleep(1100); //roll #3
      const rolls_remaining_before = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rolls_remaining_before).toBe(0);

      await rollButton.click(); //roll attempt #4
      await sleep(1100);
      const rolls_remaining_after = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rolls_remaining_after).toBe(0);

      await rollButton.click(); //roll attempt #4
      await sleep(1100);
      const rolls_remaining_after2 = await page.evaluate(
        "window.dice.get_rolls_remaining();"
      );
      expect(rolls_remaining_after2).toBe(0);
    });
  });

  describe("5) UI - Loading/Updating Scorecard Tests", () => {
    it("5.1: Game page should load the correct scorecard values for an existing game", async () => {
      //Update an exisiting scorecard in the DB for an existing user and game
      let username = users[1]["username"];
      let game_name = username + "game1";

      //Get scorecard id
      let url = "httzp://127.0.0.1:5000/users/" + username;
      let res = await fetch(url);
      let user_info = JSON.parse(await res.text());

      url = "http://127.0.0.1:5000/games/" + game_name;
      res = await fetch(url);
      game_info = JSON.parse(await res.text());

      //get scorecard for user with game_id
      url = "http://127.0.0.1:5000/scorecards";
      res = await fetch(url);
      let all_scorecards = JSON.parse(await res.text());
      let scorecard_info = {};
      for (scorecard of all_scorecards) {
        if (
          scorecard.user_id == user_info["id"] &&
          scorecard.game_id == game_info["id"]
        ) {
          scorecard_info = scorecard;
          break;
        }
      }

      let new_score_info = {
        dice_rolls: 2,
        upper: {
          ones: 3,
          twos: -1,
          threes: 9,
          fours: -1,
          fives: -1,
          sixes: 12,
        },
        lower: {
          three_of_a_kind: -1,
          four_of_a_kind: -1,
          full_house: 25,
          small_straight: 0,
          large_straight: 0,
          yahtzee: 50,
          chance: -1,
        },
      };
      //update scorecard for user+game
      url = "http://127.0.0.1:5000/scorecards/" + scorecard_info.id;
      let headers = {
        "Content-Type": "application/json",
      };
      res = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(new_score_info),
      });

      //visit page
      await page.goto(url_base + "/games/" + game_name + "/" + username, {
        waitUntil: "domcontentloaded",
      });
      await page.screenshot({
        type: "png",
        path: "./5_1_screenshot.png", // where to save it
        fullPage: true, // will scroll down to capture everything if true
      });
      //verify that all scorecard info and UI settings are accurate
      all_scorecard_values = await get_all_scorecard_values(page);
      expect(parseInt(all_scorecard_values["rolls_remaining"])).toBe(2);
      expect(parseInt(all_scorecard_values["one"])).toBe(3);
      let isDisabled = await page.evaluate(
        `document.getElementById("one_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(all_scorecard_values["two"]).toBe("");
      isDisabled = await page.evaluate(
        `document.getElementById("two_input").disabled;`
      );
      expect(isDisabled).toBe(false);
      expect(parseInt(all_scorecard_values["three"])).toBe(9);
      isDisabled = await page.evaluate(
        `document.getElementById("three_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(all_scorecard_values["four"]).toBe("");
      isDisabled = await page.evaluate(
        `document.getElementById("four_input").disabled;`
      );
      expect(isDisabled).toBe(false);
      expect(all_scorecard_values["five"]).toBe("");
      isDisabled = await page.evaluate(
        `document.getElementById("five_input").disabled;`
      );
      expect(isDisabled).toBe(false);
      expect(parseInt(all_scorecard_values["six"])).toBe(12);
      isDisabled = await page.evaluate(
        `document.getElementById("six_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(all_scorecard_values["three_of_a_kind"]).toBe("");
      isDisabled = await page.evaluate(
        `document.getElementById("three_of_a_kind_input").disabled;`
      );
      expect(isDisabled).toBe(false);
      expect(all_scorecard_values["four_of_a_kind"]).toBe("");
      isDisabled = await page.evaluate(
        `document.getElementById("four_of_a_kind_input").disabled;`
      );
      expect(isDisabled).toBe(false);
      expect(parseInt(all_scorecard_values["full_house"])).toBe(25);
      isDisabled = await page.evaluate(
        `document.getElementById("full_house_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(parseInt(all_scorecard_values["small_straight"])).toBe(0);
      isDisabled = await page.evaluate(
        `document.getElementById("small_straight_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(parseInt(all_scorecard_values["large_straight"])).toBe(0);
      isDisabled = await page.evaluate(
        `document.getElementById("large_straight_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(parseInt(all_scorecard_values["yahtzee"])).toBe(50);
      isDisabled = await page.evaluate(
        `document.getElementById("yahtzee_input").disabled;`
      );
      expect(isDisabled).toBe(true);
      expect(all_scorecard_values["chance"]).toBe("");
      isDisabled = await page.evaluate(
        `document.getElementById("chance_input").disabled;`
      );
      expect(isDisabled).toBe(false);
    });

    it("5.2: Game page should load the correct scorecard values for a new game", async () => {
      let username = users[2]["username"];
      let game_name = username + "game1"; //all blank scores
      await page.goto(url_base + "/games/" + game_name + "/" + username, {
        waitUntil: "domcontentloaded",
      });

      //verify that all scorecard info and UI settings are accurate ... all blank categories
      all_scorecard_values = await get_all_scorecard_values(page);
      expect(parseInt(all_scorecard_values["rolls_remaining"])).toBe(3);
      expect(all_scorecard_values["one"]).toBe("");
      expect(all_scorecard_values["two"]).toBe("");
      expect(all_scorecard_values["three"]).toBe("");
      expect(all_scorecard_values["four"]).toBe("");
      expect(all_scorecard_values["five"]).toBe("");
      expect(all_scorecard_values["six"]).toBe("");
      expect(all_scorecard_values["three_of_a_kind"]).toBe("");
      expect(all_scorecard_values["four_of_a_kind"]).toBe("");
      expect(all_scorecard_values["full_house"]).toBe("");
      expect(all_scorecard_values["small_straight"]).toBe("");
      expect(all_scorecard_values["large_straight"]).toBe("");
      expect(all_scorecard_values["yahtzee"]).toBe("");
      expect(all_scorecard_values["chance"]).toBe("");
    });

    it("5.3: A valid score entry should result in the scorecard being updated in the db_server", async () => {
      let username = users[1]["username"];
      let game_name = username + "game1";
      await page.goto(url_base + "/games/" + game_name + "/" + username, {
        waitUntil: "domcontentloaded",
      });
      //loads scores from test 5.1
      await page.screenshot({
        type: "png",
        path: "./5_3_page_load.png",
        fullPage: true,
      });
      let scorecard_before = await page.evaluate(
        "window.scorecard.to_object();"
      );
      await enterCategory(page, [1, 5, 3, 5, 5], "five_input", 15);
      await page.screenshot({
        type: "png",
        path: "./5_3_after_valid_score_entry.png",
        fullPage: true,
      });
      let scorecard_after = await page.evaluate(
        "window.scorecard.to_object();"
      );

      //Get scorecard id
      let url = "http://127.0.0.1:5000/users/" + username;
      let res = await fetch(url);
      let user_info = JSON.parse(await res.text());

      url = "http://127.0.0.1:5000/games/" + game_name;
      res = await fetch(url);
      game_info = JSON.parse(await res.text());

      //get scorecard for user with game_id
      url = "http://127.0.0.1:5000/scorecards";
      res = await fetch(url);
      let all_scorecards = JSON.parse(await res.text());
      let DB_route_scorecard_info = {};
      for (scorecard of all_scorecards) {
        if (
          scorecard.user_id == user_info["id"] &&
          scorecard.game_id == game_info["id"]
        ) {
          DB_route_scorecard_info = scorecard;
          break;
        }
      }

      expect(scorecard_before["upper"]["fives"]).toBe(-1);
      expect(scorecard_after["upper"]["fives"]).toBe(
        DB_route_scorecard_info.score_info["upper"]["fives"]
      );
      expect(DB_route_scorecard_info.score_info["upper"]["fives"]).toBe(15);
      expect(DB_route_scorecard_info.score_info["upper"]["ones"]).toBe(3);
      expect(DB_route_scorecard_info.score_info["upper"]["sixes"]).toBe(12);
    });
    it("5.4: An invalid score entry should not result in an updated scorecard being in the db_server", async () => {
      let username = users[1]["username"];
      let game_name = username + "game1";
      await page.goto(url_base + "/games/" + game_name + "/" + username, {
        waitUntil: "domcontentloaded",
      });
      //loads scores from test 5.1
      await page.screenshot({
        type: "png",
        path: "./5_4_page_load.png",
        fullPage: true,
      });
      let scorecard_before = await page.evaluate(
        "window.scorecard.to_object();"
      );

      await enterCategory(page, [4, 5, 3, 5, 5], "four_input", 8);
      await page.screenshot({
        type: "png",
        path: "./5_4_after_invalid_score_entry.png",
        fullPage: true,
      });
      let scorecard_after = await page.evaluate(
        "window.scorecard.to_object();"
      );
      //Get scorecard id
      let url = "http://127.0.0.1:5000/users/" + username;
      let res = await fetch(url);
      let user_info = JSON.parse(await res.text());

      url = "http://127.0.0.1:5000/games/" + game_name;
      res = await fetch(url);
      game_info = JSON.parse(await res.text());

      //get scorecard for user with game_id
      url = "http://127.0.0.1:5000/scorecards";
      res = await fetch(url);
      let all_scorecards = JSON.parse(await res.text());
      let DB_route_scorecard_info = {};
      for (scorecard of all_scorecards) {
        if (
          scorecard.user_id == user_info["id"] &&
          scorecard.game_id == game_info["id"]
        ) {
          DB_route_scorecard_info = scorecard;
          break;
        }
      }

      expect(scorecard_before["upper"]["fours"]).toBe(-1);
      expect(scorecard_after["upper"]["fours"]).toBe(
        DB_route_scorecard_info.score_info["upper"]["fours"]
      );
      expect(DB_route_scorecard_info.score_info["upper"]["fours"]).toBe(-1);
      expect(DB_route_scorecard_info.score_info["upper"]["fives"]).toBe(15);
      expect(DB_route_scorecard_info.score_info["upper"]["ones"]).toBe(3);
      expect(DB_route_scorecard_info.score_info["upper"]["sixes"]).toBe(12);
    });
    it("5.5: Game page should update the correct scorecard in DB after a game is finished", async () => {
      let username = users[1]["username"];
      let game_name = username + "game1";
      await page.goto(url_base + "/games/" + game_name + "/" + username, {
        waitUntil: "domcontentloaded",
      });
      //loads scores from test 5.1
      await page.screenshot({
        type: "png",
        path: "./5_5_page_load.png",
        fullPage: true,
      });
      let scorecard_before = await page.evaluate(
        "window.scorecard.to_object();"
      );

      await enterCategory(page, [4, 5, 3, 5, 5], "two_input", 0);
      await enterCategory(page, [4, 5, 3, 5, 5], "four_input", 4);
      await enterCategory(page, [4, 5, 3, 5, 5], "three_of_a_kind_input", 22);
      await enterCategory(page, [4, 5, 5, 5, 5], "four_of_a_kind_input", 24);
      await enterCategory(page, [5, 5, 5, 5, 5], "chance_input", 25);
      await page.screenshot({
        type: "png",
        path: "./5_5_after_full.png",
        fullPage: true,
      });
      let scorecard_after_full = await page.evaluate(
        "window.scorecard.to_object();"
      );

      //Get scorecard id
      let url = "http://127.0.0.1:5000/users/" + username;
      let res = await fetch(url);
      let user_info = JSON.parse(await res.text());

      url = "http://127.0.0.1:5000/games/" + game_name;
      res = await fetch(url);
      game_info = JSON.parse(await res.text());

      //get scorecard for user with game_id
      url = "http://127.0.0.1:5000/scorecards";
      res = await fetch(url);
      let all_scorecards = JSON.parse(await res.text());
      let DB_route_scorecard_info = {};
      for (scorecard of all_scorecards) {
        if (
          scorecard.user_id == user_info["id"] &&
          scorecard.game_id == game_info["id"]
        ) {
          DB_route_scorecard_info = scorecard;
          break;
        }
      }

      expect(DB_route_scorecard_info.score_info["upper"]["ones"]).toBe(3);
      expect(DB_route_scorecard_info.score_info["upper"]["twos"]).toBe(0);
      expect(DB_route_scorecard_info.score_info["upper"]["threes"]).toBe(9);
      expect(DB_route_scorecard_info.score_info["upper"]["fours"]).toBe(4);
      expect(DB_route_scorecard_info.score_info["upper"]["fives"]).toBe(15);
      expect(DB_route_scorecard_info.score_info["upper"]["sixes"]).toBe(12);
      expect(
        DB_route_scorecard_info.score_info["lower"]["three_of_a_kind"]
      ).toBe(22);
      expect(
        DB_route_scorecard_info.score_info["lower"]["four_of_a_kind"]
      ).toBe(24);
      expect(DB_route_scorecard_info.score_info["lower"]["full_house"]).toBe(
        25
      );
      expect(
        DB_route_scorecard_info.score_info["lower"]["small_straight"]
      ).toBe(0);
      expect(
        DB_route_scorecard_info.score_info["lower"]["large_straight"]
      ).toBe(0);
      expect(DB_route_scorecard_info.score_info["lower"]["yahtzee"]).toBe(50);
      expect(DB_route_scorecard_info.score_info["lower"]["chance"]).toBe(25);
    });
  });
});
