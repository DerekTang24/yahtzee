const puppeteer = require('puppeteer');
const tools = require('./util');

let url_base='http://127.0.0.1:3000'
let num_games_per_user=3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function enterCategory(page, dice_values, category_id, score) {
   await page.evaluate((dice_values, category_id, score) => {
     window.dice.set(dice_values, 2);
     document.getElementById(category_id).value=score;
   }, dice_values, category_id, score);
 
   await page.focus(`input[id="${category_id}"]`);
   await page.keyboard.press("Enter");
 }
let score_info_finished={
   "dice_rolls":0,
   "upper":{
       "ones":4,
       "twos":8,
       "threes":12,
       "fours":16,
       "fives":20,
       "sixes":24
   },
   "lower":{
       "three_of_a_kind":20,
       "four_of_a_kind":26,
       "full_house":25,
       "small_straight":0,
       "large_straight":40,
       "yahtzee":50,
       "chance":8
   }
}
let score_info_finished_no_bonus={
   "dice_rolls":0,
   "upper":{
       "ones":4,
       "twos":8,
       "threes":12,
       "fours":16,
       "fives":20,
       "sixes":0
   },
   "lower":{
       "three_of_a_kind":20,
       "four_of_a_kind":26,
       "full_house":0,
       "small_straight":0,
       "large_straight":40,
       "yahtzee":50,
       "chance":8
   }
}
let score_info_partial={
   "dice_rolls":2,
   "upper":{
       "ones":4,
       "twos":8,
       "threes":-1,
       "fours":-1,
       "fives":-1,
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
}
let score_info_partial_bonus={
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
}
async function get_all_scorecard_values(page){
   let all_scorecard_values={};

   all_scorecard_values["rolls_remaining"] = await page.evaluate('document.getElementById("rolls_remaining").innerHTML');
   all_scorecard_values["one"] = await page.evaluate('document.getElementById("one_input").value');
   all_scorecard_values["two"] = await page.evaluate('document.getElementById("two_input").value');
   all_scorecard_values["three"] = await page.evaluate('document.getElementById("three_input").value');
   all_scorecard_values["four"] = await page.evaluate('document.getElementById("four_input").value');
   all_scorecard_values["five"] = await page.evaluate('document.getElementById("five_input").value');
   all_scorecard_values["six"] = await page.evaluate('document.getElementById("six_input").value');
   all_scorecard_values["three_of_a_kind"] = await page.evaluate('document.getElementById("three_of_a_kind_input").value');
   all_scorecard_values["four_of_a_kind"] = await page.evaluate('document.getElementById("four_of_a_kind_input").value');
   all_scorecard_values["full_house"] = await page.evaluate('document.getElementById("full_house_input").value');
   all_scorecard_values["small_straight"] = await page.evaluate('document.getElementById("small_straight_input").value');
   all_scorecard_values["large_straight"] = await page.evaluate('document.getElementById("large_straight_input").value');
   all_scorecard_values["yahtzee"] = await page.evaluate('document.getElementById("yahtzee_input").value');
   all_scorecard_values["chance"] = await page.evaluate('document.getElementById("chance_input").value');
   
   return all_scorecard_values;
}

async function get_all_score_values(page){
   let all_score_values={};
   all_score_values["upper_score"] = await page.evaluate('document.getElementById("upper_score").innerHTML');
   all_score_values["upper_bonus"] = await page.evaluate('document.getElementById("upper_bonus").innerHTML');
   all_score_values["upper_total"] = await page.evaluate('document.getElementById("upper_total").innerHTML');
   all_score_values["upper_total_lower"] = await page.evaluate('document.getElementById("upper_total_lower").innerHTML');
   all_score_values["lower_score"] = await page.evaluate('document.getElementById("lower_score").innerHTML');
   all_score_values["grand_total"] = await page.evaluate('document.getElementById("grand_total").innerHTML');   
   return all_score_values;
}

describe('Scorecard', () => {
  let browser;
  let page;
  let users;
  let game_names;

  beforeAll(async () => {
    browser = await puppeteer.launch({headless:true}); 
    await tools.delete_all_scorecards_from_DB()
    await tools.delete_all_games_from_DB()
    await tools.delete_all_users_from_DB()

    users= await tools.add_users_to_DB(4)
    game_names = await tools.add_1_player_games(users, num_games_per_user)
  });

  beforeEach(async () => {
    page = await browser.newPage();
    let game_name = users[0]["username"]+"game1";
    let username = users[0]["username"];
    await page.goto(url_base+'/games/'+game_name+"/"+username, {waitUntil: 'domcontentloaded'})
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
  
  describe('1) Scorecard- load_scorecard()/to_object() Tests', () => {
   it("1.1: load_scorecard() should correctly load a full scorecard w/ category scores of 0", async () => {
      
     await page.evaluate((score_info_finished) => {
         window.scorecard.load_scorecard(score_info_finished);
     }, score_info_finished);

     all_scorecard_values = await get_all_scorecard_values(page);
     expect(parseInt(all_scorecard_values["rolls_remaining"])).toBe(0);
     expect(parseInt(all_scorecard_values["one"])).toBe(4);
     expect(parseInt(all_scorecard_values["two"])).toBe(8);
     expect(parseInt(all_scorecard_values["three"])).toBe(12);
     expect(parseInt(all_scorecard_values["four"])).toBe(16);
     expect(parseInt(all_scorecard_values["five"])).toBe(20);
     expect(parseInt(all_scorecard_values["six"])).toBe(24);
     expect(parseInt(all_scorecard_values["three_of_a_kind"])).toBe(20);
     expect(parseInt(all_scorecard_values["four_of_a_kind"])).toBe(26);
     expect(parseInt(all_scorecard_values["full_house"])).toBe(25);
     expect(parseInt(all_scorecard_values["small_straight"])).toBe(0);
     expect(parseInt(all_scorecard_values["large_straight"])).toBe(40);
     expect(parseInt(all_scorecard_values["yahtzee"])).toBe(50);
     expect(parseInt(all_scorecard_values["chance"])).toBe(8);
   });
   it("1.2: load_scorecard() should correctly load a partial scorecard", async () => {
      
     await page.evaluate((score_info_partial) => {
         window.scorecard.load_scorecard(score_info_partial);
     }, score_info_partial);

     all_scorecard_values = await get_all_scorecard_values(page);
     expect(all_scorecard_values["rolls_remaining"]).toBe("2");
     expect(all_scorecard_values["one"]).toBe("4");
     expect(all_scorecard_values["two"]).toBe("8");
     expect(all_scorecard_values["three"]).toBe("");
     expect(all_scorecard_values["four"]).toBe("");
     expect(all_scorecard_values["five"]).toBe("");
     expect(all_scorecard_values["six"]).toBe("24");
     expect(all_scorecard_values["three_of_a_kind"]).toBe("");
     expect(all_scorecard_values["four_of_a_kind"]).toBe("26");
     expect(all_scorecard_values["full_house"]).toBe("");
     expect(all_scorecard_values["small_straight"]).toBe("0");
     expect(all_scorecard_values["large_straight"]).toBe("40");
     expect(all_scorecard_values["yahtzee"]).toBe("0");
     expect(all_scorecard_values["chance"]).toBe("8");
   });
   it("1.3: to_object() should correctly return a full scorecard w/ category scores of 0", async () => {
     await page.evaluate((score_info_finished_no_bonus) => {
         window.scorecard.load_scorecard(score_info_finished_no_bonus);
     }, score_info_finished_no_bonus);

     let score_info_actual = await page.evaluate('window.scorecard.to_object();');

     expect(parseInt(score_info_actual["dice_rolls"])).toBe(score_info_finished_no_bonus["dice_rolls"]);
     expect(parseInt(score_info_actual["upper"]["ones"])).toBe(score_info_finished_no_bonus["upper"]["ones"]);
     expect(parseInt(score_info_actual["upper"]["twos"])).toBe(score_info_finished_no_bonus["upper"]["twos"]);
     expect(parseInt(score_info_actual["upper"]["threes"])).toBe(score_info_finished_no_bonus["upper"]["threes"]);
     expect(parseInt(score_info_actual["upper"]["fours"])).toBe(score_info_finished_no_bonus["upper"]["fours"]);
     expect(parseInt(score_info_actual["upper"]["fives"])).toBe(score_info_finished_no_bonus["upper"]["fives"]);
     expect(parseInt(score_info_actual["upper"]["sixes"])).toBe(score_info_finished_no_bonus["upper"]["sixes"]);
     expect(parseInt(score_info_actual["lower"]["three_of_a_kind"])).toBe(score_info_finished_no_bonus["lower"]["three_of_a_kind"]);
     expect(parseInt(score_info_actual["lower"]["four_of_a_kind"])).toBe(score_info_finished_no_bonus["lower"]["four_of_a_kind"]);
     expect(parseInt(score_info_actual["lower"]["full_house"])).toBe(score_info_finished_no_bonus["lower"]["full_house"]);
     expect(parseInt(score_info_actual["lower"]["small_straight"])).toBe(score_info_finished_no_bonus["lower"]["small_straight"]);
     expect(parseInt(score_info_actual["lower"]["large_straight"])).toBe(score_info_finished_no_bonus["lower"]["large_straight"]);
     expect(parseInt(score_info_actual["lower"]["yahtzee"])).toBe(score_info_finished_no_bonus["lower"]["yahtzee"]);
     expect(parseInt(score_info_actual["lower"]["chance"])).toBe(score_info_finished_no_bonus["lower"]["chance"]);
   });
   
   it("1.4: to_object() should correctly return a partial scorecard", async () => {
      await page.evaluate((score_info_partial) => {
         window.scorecard.load_scorecard(score_info_partial);
     }, score_info_partial);

     let score_info_actual = await page.evaluate('window.scorecard.to_object();');

     expect(parseInt(score_info_actual["dice_rolls"])).toBe(score_info_partial["dice_rolls"]);
     expect(parseInt(score_info_actual["upper"]["ones"])).toBe(score_info_partial["upper"]["ones"]);
     expect(parseInt(score_info_actual["upper"]["twos"])).toBe(score_info_partial["upper"]["twos"]);
     expect(parseInt(score_info_actual["upper"]["threes"])).toBe(score_info_partial["upper"]["threes"]);
     expect(parseInt(score_info_actual["upper"]["fours"])).toBe(score_info_partial["upper"]["fours"]);
     expect(parseInt(score_info_actual["upper"]["fives"])).toBe(score_info_partial["upper"]["fives"]);
     expect(parseInt(score_info_actual["upper"]["sixes"])).toBe(score_info_partial["upper"]["sixes"]);
     expect(parseInt(score_info_actual["lower"]["three_of_a_kind"])).toBe(score_info_partial["lower"]["three_of_a_kind"]);
     expect(parseInt(score_info_actual["lower"]["four_of_a_kind"])).toBe(score_info_partial["lower"]["four_of_a_kind"]);
     expect(parseInt(score_info_actual["lower"]["full_house"])).toBe(score_info_partial["lower"]["full_house"]);
     expect(parseInt(score_info_actual["lower"]["small_straight"])).toBe(score_info_partial["lower"]["small_straight"]);
     expect(parseInt(score_info_actual["lower"]["large_straight"])).toBe(score_info_partial["lower"]["large_straight"]);
     expect(parseInt(score_info_actual["lower"]["yahtzee"])).toBe(score_info_partial["lower"]["yahtzee"]);
     expect(parseInt(score_info_actual["lower"]["chance"])).toBe(score_info_partial["lower"]["chance"]);
   });
   it("1.5: to_object() should not include extra input for non-disabled categories", async () => {
      await page.evaluate((score_info_partial) => {
         window.scorecard.load_scorecard(score_info_partial);
     }, score_info_partial);

     //Enter test, but don't press Enter
     await page.evaluate('document.getElementById("three_input").value=9;');
     await page.evaluate('document.getElementById("three_of_a_kind_input").value=19;');

     let score_info_actual = await page.evaluate('window.scorecard.to_object();');

     expect(parseInt(score_info_actual["dice_rolls"])).toBe(score_info_partial["dice_rolls"]);
     expect(parseInt(score_info_actual["upper"]["ones"])).toBe(score_info_partial["upper"]["ones"]);
     expect(parseInt(score_info_actual["upper"]["twos"])).toBe(score_info_partial["upper"]["twos"]);
     expect(parseInt(score_info_actual["upper"]["threes"])).toBe(score_info_partial["upper"]["threes"]);
     expect(parseInt(score_info_actual["upper"]["fours"])).toBe(score_info_partial["upper"]["fours"]);
     expect(parseInt(score_info_actual["upper"]["fives"])).toBe(score_info_partial["upper"]["fives"]);
     expect(parseInt(score_info_actual["upper"]["sixes"])).toBe(score_info_partial["upper"]["sixes"]);
     expect(parseInt(score_info_actual["lower"]["three_of_a_kind"])).toBe(score_info_partial["lower"]["three_of_a_kind"]);
     expect(parseInt(score_info_actual["lower"]["four_of_a_kind"])).toBe(score_info_partial["lower"]["four_of_a_kind"]);
     expect(parseInt(score_info_actual["lower"]["full_house"])).toBe(score_info_partial["lower"]["full_house"]);
     expect(parseInt(score_info_actual["lower"]["small_straight"])).toBe(score_info_partial["lower"]["small_straight"]);
     expect(parseInt(score_info_actual["lower"]["large_straight"])).toBe(score_info_partial["lower"]["large_straight"]);
     expect(parseInt(score_info_actual["lower"]["yahtzee"])).toBe(score_info_partial["lower"]["yahtzee"]);
     expect(parseInt(score_info_actual["lower"]["chance"])).toBe(score_info_partial["lower"]["chance"]);
   });
  });

  
  describe('2) Scorecard - is_finished() Tests:', () => {
   it("2.1: is_finished() should correctly return true for a full scorecard", async () => {
      await page.evaluate((score_info_finished) => {
         window.scorecard.load_scorecard(score_info_finished);
     }, score_info_finished);
     let actual_finished = await page.evaluate('window.scorecard.is_finished();');
     let expected_finish = true;
     expect(actual_finished).toBe(expected_finish);
   });
   it("2.2: is_finished() should correctly return false for a partial scorecard", async () => {
      await page.evaluate((score_info_partial) => {
         window.scorecard.load_scorecard(score_info_partial);
     }, score_info_partial);
     let actual_finished = await page.evaluate('window.scorecard.is_finished();');
     let expected_finish = false;
     expect(actual_finished).toBe(expected_finish);
   });
  });

  describe('3) Scorecard - get_score() Tests:', () => {
   it("3.1: get_score() should return the correct score for a full scorecard w/ no bonus", async () => {
      await page.evaluate((score_info_finished_no_bonus) => {
         window.scorecard.load_scorecard(score_info_finished_no_bonus);
     }, score_info_finished_no_bonus);
     let actual_score = await page.evaluate('window.scorecard.get_score();');
     let expected_score = 204;
     expect(actual_score).toBe(expected_score);
   });
   it("3.2: get_score() should return the correct score for a full scorecard w/ bonus", async () => {
      await page.evaluate((score_info_finished) => {
         window.scorecard.load_scorecard(score_info_finished);
     }, score_info_finished);
     let actual_score = await page.evaluate('window.scorecard.get_score();');
     let expected_score = 288;
     expect(actual_score).toBe(expected_score);
   });
   it("3.3: get_score() should return the correct score for a partial scorecard w/ no bonus", async () => {
      await page.evaluate((score_info_partial) => {
         window.scorecard.load_scorecard(score_info_partial);
     }, score_info_partial);
     let actual_score = await page.evaluate('window.scorecard.get_score();');
     let expected_score = 110;
     expect(actual_score).toBe(expected_score);
   });
   it("3.4: get_score() should return the correct score for a partial scorecard w/ bonus", async () => {
      await page.evaluate((score_info_partial_bonus) => {
         window.scorecard.load_scorecard(score_info_partial_bonus);
     }, score_info_partial_bonus);
     let actual_score = await page.evaluate('window.scorecard.get_score();');
     let expected_score = 193;
     expect(actual_score).toBe(expected_score);
   });
  });
  
  describe('4) Scorecard - is_valid_score() Tests', () => {
   const upper_tests={
      "one" : [
        [0, [6, 2, 3, 4, 5], true],
        [1,[1, 2, 3, 4, 5], true],
        [2,[1, 2, 3, 1, 5], true],
        [3,[1, 2, 1, 1, 5], true],
        [4,[1, 2, 1, 1, 1], true],
        [5,[1, 1, 1, 1, 1], true],
        [0, [0,0,0,0,0], false],
        [-4, [1, 2, 3, 4, 5], false],
        [4, [1, 2, 3, 4, 5], false],
        ["", [1, 2, 3, 4, 5], false],
        [" ", [1, 2, 3, 4, 5], false],
        ["four", [1, 2, 1, 1, 1], false]
      ],
      "two":[
        [0,[6, 1, 3, 4, 5],true],
        [2,[1, 2, 3, 4, 5],true],
        [4,[1, 2, 3, 2, 5],true],
        [6,[1, 2, 2, 2, 5],true],
        [8,[2, 2, 2, 2, 1],true],
        [10,[2, 2, 2, 2, 2],true],
        [0, [0,0,0,0,0], false],
        [4, [1, 2, 3, 4, 5], false],
        [-4, [1, 2, 3, 4, 5], false],
        ["", [1, 2, 3, 4, 5], false],
        [" ", [1, 2, 3, 4, 5], false],
        ["two", [1, 2, 1, 1, 1], false]
      ],
      "three":[
        [0,[6, 1, 2, 4, 5],true],
        [3,[1, 2, 3, 4, 5],true],
        [6,[1, 2, 3, 3, 5],true],
        [9,[3, 2, 3, 2, 3],true],
        [12,[3, 2, 3, 3, 3],true],
        [15,[3, 3, 3, 3, 3],true],
        [0, [0,0,0,0,0], false],
        [4, [1, 2, 3, 4, 5], false],
        [-4, [1, 2, 3, 4, 5], false],
        ["", [1, 2, 3, 4, 5], false],
        [" ", [1, 2, 3, 4, 5], false],
        ["three", [1, 2, 3, 1, 1], false]
      ],
      "four":[
        [0,[2, 3, 5, 6, 1],true],
        [4,[1, 2, 3, 4, 5],true],
        [8,[1, 4, 4, 2, 5],true],
        [12,[4, 4, 2, 4, 5],true],
        [16,[4, 4, 2, 4, 4],true],
        [20,[4, 4, 4, 4, 4],true],
        [0, [0,0,0,0,0], false],
        [8, [1, 2, 3, 4, 5], false],
        [-8, [1, 2, 3, 4, 5], false],
        ["", [1, 2, 3, 4, 5], false],
        [" ", [1, 2, 3, 4, 5], false],
        ["four", [1, 2, 1, 1, 1], false]
      ],
      "five":[
        [0,[1, 2, 3, 4, 6],true],
        [5,[1, 2, 3, 4, 5],true],
        [10,[1, 5, 3, 2, 5],true],
        [15,[1, 5, 5, 2, 5],true],
        [20,[5, 5, 5, 5, 1],true],
        [25,[5, 5, 5, 5, 5],true],
        [0, [0,0,0,0,0], false],
        [10, [1, 2, 3, 4, 5], false],
        [-10, [1, 2, 3, 4, 5], false],
        ["", [1, 2, 3, 4, 5], false],
        [" ", [1, 2, 3, 4, 5], false],
        ["five", [1, 2, 1, 5, 1], false]
      ],
      "six":[
        [0,[5, 5, 4, 3, 2],true],
        [6,[1, 2, 6, 4, 5],true],
        [12,[1, 6, 3, 6, 5],true],
        [18,[1, 2, 6, 6, 6],true],
        [24,[6, 6, 6, 2, 6],true],
        [30,[6, 6, 6, 6, 6],true],
        [0, [0,0,0,0,0], false],
        [6, [1, 2, 3, 4, 5], false],
        [-6, [1, 2, 3, 4, 5], false],
        ["", [1, 2, 3, 4, 5], false],
        [" ", [1, 2, 3, 4, 5], false],
        ["six", [1, 2, 6, 1, 1], false]
      ]
    }
    let count =1;
    for (let category_id in upper_tests){
    let cat_tests = upper_tests[category_id];
    for(let test of cat_tests){
       let newDice = test[1];
       let score = test[0];
       let expectedResult = test[2];
      it(`4.1.${count} Upper: ${ category_id}- ${score} for ${newDice} -> ${expectedResult}`, async() => {
         let el_id = category_id+"_input";
         await enterCategory(page, newDice, el_id, score);
         let isDisabled = await page.evaluate(`document.getElementById("${el_id}").disabled;`);
         expect(isDisabled).toBe(expectedResult);
       });
       count+=1;
     }
   }
   
   const lower_tests={
      "three_of_a_kind":[
         [7,[1, 1, 1, 2, 2],true],
         [7,[1, 1, 2, 1, 2],true],
         [7,[1, 1, 2, 2, 1],true],
         [7,[1, 2, 1, 1, 2],true],
         [11,[1, 2, 1, 6, 1],true],
         [8,[2, 1, 1, 1, 3],true],
         [7,[2, 1, 1, 2, 1],true],
         [18,[4, 5, 3, 3, 3],true],
         [18,[4, 3, 5, 3, 3],true],
         [18,[3, 4, 5, 3, 3],true],
         [27,[6, 4, 6, 5, 6],true],
         [9,[2, 2, 2, 1, 2],true],
         [16,[3, 3, 4, 3, 3],true],
         [21,[4, 5, 4, 4, 4],true],
         [26,[6, 5, 5, 5, 5],true],
         [20,[4, 4, 4, 4, 4],true],
         [25,[5, 5, 5, 5, 5],true],
         [30,[6, 6, 6, 6, 6],true],
         [0,[2, 3, 4, 4, 5],true],
         [0, [0,0,0,0,0], false],
         [6, [1, 3, 3, 3, 5], false],
         [4, [1, 2, 1, 1, 1], false],
         [-3, [1, 2, 3, 4, 5], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["four", [1, 2, 1, 1, 1], false]
      ],
      "four_of_a_kind":[
         [6,[1, 1, 1, 1, 2],true],
         [9,[2, 2, 2, 1, 2],true],
         [16,[3, 3, 4, 3, 3],true],
         [21,[4, 5, 4, 4, 4],true],
         [26,[6, 5, 5, 5, 5],true],
         [20,[4, 4, 4, 4, 4],true],
         [25,[5, 5, 5, 5, 5],true],
         [30,[6, 6, 6, 6, 6],true],
         [0,[4, 5, 5, 5, 6],true],
         [0, [0,0,0,0,0], false],
         [12, [1, 3, 3, 3, 3], false],
         [3, [1, 2, 1, 1, 1], false],
         [-3, [1, 2, 3, 4, 5], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["six", [1, 2, 1, 1, 1], false]
      ],
      "full_house":[
         [25,[1, 1, 1, 2, 2],true],
         [25,[1, 1, 2, 1, 2],true],
         [25,[1, 1, 2, 2, 1],true],
         [25,[1, 2, 1, 1, 2],true],
         [25,[1, 2, 1, 2, 1],true],
         [25,[3, 1, 1, 1, 3],true],
         [25,[2, 1, 1, 2, 1],true],
         [25,[5, 5, 3, 3, 3],true],
         [25,[5, 3, 5, 3, 3],true],
         [25,[3, 5, 5, 3, 3],true],
         [25,[6, 5, 6, 5, 6],true],
         [0,[3, 3, 3, 3, 3],true],
         [0, [0,0,0,0,0], false],
         [11, [1, 3, 3, 3, 1], false],
         [25, [1, 1, 1, 1, 1], false],
         [-25, [2, 2, 3, 3, 3], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["full-house", [1, 2, 2, 1, 1], false]
      ],
      "small_straight":[
         [30,[1, 2, 3, 4, 5],true],
         [30,[1, 2, 3, 4, 6],true],
         [30,[2, 3, 4, 5, 6],true],
         [30,[2, 2, 3, 4, 5],true],
         [30,[2, 3, 4, 5, 3],true],
         [30,[1, 2, 3, 4, 5],true],
         [30,[4, 3, 4, 5, 6],true],
         [30,[2, 3, 4, 3, 1],true],
         [30,[2, 3, 4, 6, 1],true],
         [0,[1, 2, 3, 5, 6],true],
         [0, [0,0,0,0,0], false],
         [30, [1, 3, 3, 3, 1], false],
         [25, [1, 2, 3, 4, 1], false],
         [-30, [2, 3, 4, 5, 6], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["small-straight", [1, 2, 3, 4, 1], false]
      ],
      "large_straight":[
         [40,[1, 2, 3, 4, 5],true],
         [40,[3, 2, 1, 4, 5],true],
         [40,[1, 4, 3, 5, 2],true],
         [40,[2, 3, 4, 5, 6],true],
         [40,[4, 5, 3, 2, 6],true],
         [40,[2, 5, 3, 4, 6],true],
         [0,[1, 2, 3, 4, 6],true],
         [0, [0,0,0,0,0], false],
         [40, [1, 3, 3, 3, 1], false],
         [30, [1, 2, 3, 4, 5], false],
         [-40, [2, 3, 4, 5, 6], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["large-straight", [1, 2, 3, 4, 5], false]
      ],
      "yahtzee":[
         [50,[1, 1, 1, 1, 1],true],
         [50,[2, 2, 2, 2, 2],true],
         [50,[3, 3, 3, 3, 3],true],
         [50,[4, 4, 4, 4, 4],true],
         [50,[5, 5, 5, 5, 5],true],
         [50,[6, 6, 6, 6, 6],true],
         [0,[3, 3, 3, 4, 3],true],
         [0, [0,0,0,0,0], false],
         [50, [1, 3, 3, 3, 1], false],
         [25, [2, 2, 2, 2, 2], false],
         [-50, [4, 4, 4, 4, 4], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["yahtzee", [2, 2, 2, 2, 2], false]
      ],
      "chance":[
         [6,[1, 1, 1, 1, 2],true],
         [9,[2, 2, 2, 1, 2],true],
         [16,[3, 3, 4, 3, 3],true],
         [21,[4, 5, 4, 4, 4],true],
         [26,[6, 5, 5, 5, 5],true],
         [0, [0,0,0,0,0], false],
         [25, [5, 5, 5, 5, 4], false],
         ["", [1, 2, 3, 4, 5], false],
         [" ", [1, 2, 3, 4, 5], false],
         ["chance", [1, 2, 3, 4, 1], false]
      ]
      }
      count =1;
      for (let category_id in lower_tests){
      let cat_tests = lower_tests[category_id];
      for(let test of cat_tests){
         let newDice = test[1];
         let score = test[0];
         let expectedResult = test[2];
        it(`4.2.${count} Lower: ${ category_id}- ${score} for ${newDice} -> ${expectedResult}`, async() => {
           let el_id = category_id+"_input";
           await enterCategory(page, newDice, el_id, score);
           let isDisabled = await page.evaluate(`document.getElementById("${el_id}").disabled;`);
           expect(isDisabled).toBe(expectedResult);
         });
         count+=1;
       }
     }
  });

  describe('5) Scorecard- update_scores() Tests', () => {
   it("5.1: update_scores() should correctly update score elements for a full scorecard w/ no bonus", async () => {
     await page.evaluate((score_info_finished_no_bonus) => {
         window.scorecard.load_scorecard(score_info_finished_no_bonus);
     }, score_info_finished_no_bonus);

     let score_values = await get_all_score_values(page);
     expect(score_values["upper_score"]).toBe("60");
     expect(score_values["upper_bonus"]).toBe("");
     expect(score_values["upper_total"]).toBe("60");
     expect(score_values["upper_total_lower"]).toBe("60");
     expect(score_values["lower_score"]).toBe("144");
     expect(score_values["grand_total"]).toBe("204");
   });
   it("5.2: get_score() should correctly update score elements for a full scorecard w/ bonus", async () => {
     await page.evaluate((score_info_finished) => {
         window.scorecard.load_scorecard(score_info_finished);
     }, score_info_finished);

     let score_values = await get_all_score_values(page);
     expect(score_values["upper_score"]).toBe("84");
     expect(score_values["upper_bonus"]).toBe("35");
     expect(score_values["upper_total"]).toBe("119");
     expect(score_values["upper_total_lower"]).toBe("119");
     expect(score_values["lower_score"]).toBe("169");
     expect(score_values["grand_total"]).toBe("288");
   });
   it("5.3: get_score() should correctly update score elements for a partial scorecard w/ no bonus", async () => {
      await page.evaluate((score_info_partial) => {
         window.scorecard.load_scorecard(score_info_partial);
     }, score_info_partial);

     let score_values = await get_all_score_values(page);
     expect(score_values["upper_score"]).toBe("36");
     expect(score_values["upper_bonus"]).toBe("");
     expect(score_values["upper_total"]).toBe("36");
     expect(score_values["upper_total_lower"]).toBe("36");
     expect(score_values["lower_score"]).toBe("74");
     expect(score_values["grand_total"]).toBe("110");
   });
   it("5.4: get_score() should correctly update score elements for a partial scorecard w/ bonus", async () => {
     await page.evaluate((score_info_partial_bonus) => {
         window.scorecard.load_scorecard(score_info_partial_bonus);
     }, score_info_partial_bonus);

     let score_values = await get_all_score_values(page);
     expect(score_values["upper_score"]).toBe("84");
     expect(score_values["upper_bonus"]).toBe("35");
     expect(score_values["upper_total"]).toBe("119");
     expect(score_values["upper_total_lower"]).toBe("119");
     expect(score_values["lower_score"]).toBe("74");
     expect(score_values["grand_total"]).toBe("193");
   });
  });

});