const puppeteer = require('puppeteer');
const tools = require('./util');

let url_base='http://127.0.0.1:3000'
let num_games_per_user=3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Dice', () => {
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
  
  describe('1) Dice- get_rolls_remaining() Tests ', () => {
    it("1.1: get_rolls_remaining() should correctly return 3, 2, 1, 0 rolls remaining", async () => {
        let rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
        expect(rolls_remaining).toBe(3);
        rolls_remaining = await page.evaluate('window.dice.get_rolls_remaining();')
        expect(rolls_remaining).toBe(3);
        await page.evaluate('document.getElementById("rolls_remaining").innerHTML=2');
        rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
        expect(rolls_remaining).toBe(2);
        rolls_remaining = await page.evaluate('window.dice.get_rolls_remaining();')
        expect(rolls_remaining).toBe(2);
        await page.evaluate('document.getElementById("rolls_remaining").innerHTML=1');
        rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
        expect(rolls_remaining).toBe(1);
        rolls_remaining = await page.evaluate('window.dice.get_rolls_remaining();')
        expect(rolls_remaining).toBe(1);
        await page.evaluate('document.getElementById("rolls_remaining").innerHTML=0');
        rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
        expect(rolls_remaining).toBe(0);
        rolls_remaining = await page.evaluate('window.dice.get_rolls_remaining();')
        expect(rolls_remaining).toBe(0);
    });
  });
  describe('2) Dice - set() Tests', () => {
    it("2.1: set() should correctly change valid dice pictures and rolls remaining", async () => {
        //invoke set
        await page.evaluate('window.dice.set([5, 4, 3, 2, 2], 2);')
        //Check to see that the combination is the same as [5, 4, 3, 2, 2]
        let die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
        let die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
        let die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
        let die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
        let die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
        expect(die0.indexOf("five")).toBeGreaterThan(-1);
        expect(die1.indexOf("four")).toBeGreaterThan(-1);
        expect(die2.indexOf("three")).toBeGreaterThan(-1);
        expect(die3.indexOf("two")).toBeGreaterThan(-1);
        expect(die4.indexOf("two")).toBeGreaterThan(-1);
        let rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
        expect(rolls_remaining).toBe(2);
    });
    it("2.2: set() should correctly change blank dice values", async () => {
          //invoke set
          await page.evaluate('window.dice.set([0,0,0,0,0], 3);')
          //Check to see that the combination is the same as [5, 4, 3, 2, 2]
          let die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
          let die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
          let die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
          let die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
          let die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
          expect(die0.indexOf("blank")).toBeGreaterThan(-1);
          expect(die1.indexOf("blank")).toBeGreaterThan(-1);
          expect(die2.indexOf("blank")).toBeGreaterThan(-1);
          expect(die3.indexOf("blank")).toBeGreaterThan(-1);
          expect(die4.indexOf("blank")).toBeGreaterThan(-1);
          let rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
          expect(rolls_remaining).toBe(3);
    });
    it("2.3: set() should not change reserved dice values", async () => {
       //invoke set
       await page.evaluate('window.dice.set([5, 4, 3, 2, 2], 2);')
       //Check to see that the combination is the same as [5, 4, 3, 2, 2]
       let die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
       let die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
       let die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
       let die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
       let die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
       expect(die0.indexOf("five")).toBeGreaterThan(-1);
       expect(die1.indexOf("four")).toBeGreaterThan(-1);
       expect(die2.indexOf("three")).toBeGreaterThan(-1);
       expect(die3.indexOf("two")).toBeGreaterThan(-1);
       expect(die4.indexOf("two")).toBeGreaterThan(-1);
       let rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
       expect(rolls_remaining).toBe(2);

       await page.evaluate('window.dice.set([6, -1, 6, -1, 6], 1);')
       die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
       die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
       die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
       die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
       die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
       expect(die0.indexOf("six")).toBeGreaterThan(-1);
       expect(die1.indexOf("four")).toBeGreaterThan(-1);
       expect(die2.indexOf("six")).toBeGreaterThan(-1);
       expect(die3.indexOf("two")).toBeGreaterThan(-1);
       expect(die4.indexOf("six")).toBeGreaterThan(-1);
       rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
       expect(rolls_remaining).toBe(1);
    });
  });

  describe('3) Dice - reserve() Tests', () => {
    it("3.1: reserve() should correctly reserve dice", async () => {
      const rollButton = await page.$('#roll_button')
      await rollButton.click();
      await sleep(1100);
      for(let d = 0; d<5; d++){
        let die = await page.$('#die_'+d);
        let die_classList_before = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_before.indexOf("reserved")).toBe(-1);

        await die.click({
          clickCount: 2
        });

        let die_classList_after = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_after.indexOf("reserved")).toBeGreaterThan(-1);
      }//check all five dice
    });
    it("3.2: reserve() should correctly unreserve dice", async () => {
      const rollButton = await page.$('#roll_button')
      await rollButton.click();
      await sleep(1100);
      for(let d = 0; d<5; d++){
        let die = await page.$('#die_'+d);
        let die_classList_before = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_before.indexOf("reserved")).toBe(-1);

        await die.click({
          clickCount: 2
        });

        let die_classList_after = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_after.indexOf("reserved")).toBeGreaterThan(-1);

        await die.click({
          clickCount: 2
        });

        let die_classList_after_after = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_after_after.indexOf("reserved")).toBe(-1);
      }//check all five dice
    });
    it("3.3: reserve() should not reserve blank dice", async () => {
      for(let d = 0; d<5; d++){
        let die = await page.$('#die_'+d);
        let die_classList_before = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_before.indexOf("reserved")).toBe(-1);

        await die.click({
          clickCount: 2
        });

        let die_classList_after = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_after.indexOf("reserved")).toBe(-1);
      }
    });
    it("3.4: reserve() should not reserve dice w/out rolls remaining", async () => {
      const rollButton = await page.$('#roll_button')
      await rollButton.click();
      await sleep(1100);
      await rollButton.click();
      await sleep(1100);
      await rollButton.click();
      await sleep(1100);
      for(let d = 0; d<5; d++){
        let die = await page.$('#die_'+d);
        let die_classList_before = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_before.indexOf("reserved")).toBe(-1);

        await die.click({
          clickCount: 2
        });

        let die_classList_after = await page.evaluate('Array.from(document.getElementById("die_'+d+'").classList)');
        expect(die_classList_after.indexOf("reserved")).toBe(-1);
      }
    });
  });
  
  describe('4) Dice - roll() Tests', () => {
    it("4.1: roll() should correctly roll blank dice", async () => {
      const rollButton = await page.$('#roll_button')
      await rollButton.click();
      await sleep(1100);
      const roll1 = await page.evaluate('window.dice.get_values();');
      let die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      let die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      let die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      let die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      let die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);
      await rollButton.click();
      await sleep(1100);
      const roll2 = await page.evaluate('window.dice.get_values();');
      expect(roll1.toString()).not.toBe(roll2.toString());
      die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);
      await rollButton.click();
      await sleep(1100);
      const roll3 = await page.evaluate('window.dice.get_values();');
      expect(roll2.toString()).not.toBe(roll3.toString());
      die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);
    });
    it("4.2: roll() should only roll unreserved dice", async () => {
      const rollButton = await page.$('#roll_button')
      await rollButton.click();
      await sleep(1100);

      let die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      let die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      let die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      let die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      let die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);

      //Reserve first and last dice
      let die_0_before = await page.$('#die_0');
      await die_0_before.click({clickCount: 2});
      let die_4_before = await page.$('#die_4');
      await die_4_before.click({clickCount: 2});
      await rollButton.click();
      await sleep(1100);
      let die_0_after = await page.$('#die_0');
      await die_0_after.click({clickCount: 2});
      let die_4_after = await page.$('#die_4');
      await die_4_after.click({clickCount: 2});
      expect(die_0_before.src).toBe(die_0_after.src);
      expect(die_4_before.src).toBe(die_4_after.src);

      await rollButton.click();
      await sleep(1100);
      die_0_after = await page.$('#die_0');
      await die_0_after.click({clickCount: 2});
      die_4_after = await page.$('#die_4');
      await die_4_after.click({clickCount: 2});
      expect(die_0_before.src).toBe(die_0_after.src);
      expect(die_4_before.src).toBe(die_4_after.src);
    });
  });
  describe('5) Dice- Utility Method Tests', () => {
    it("5.1: get_values() should correctly return valid dice", async () => {
      await page.evaluate('window.dice.set([1, 2, 3, 4, 5], 2);');
      let diceArray = await page.evaluate('window.dice.get_values();')
      expect(JSON.stringify(diceArray)).toBe(JSON.stringify([1, 2, 3, 4, 5]));
    });

    it("5.2: get_values() should correctly return blank dice", async () => {
      await page.evaluate('window.dice.set([0,0,0,0,0], 3);');
      let diceArray = await page.evaluate('window.dice.get_values();')
      expect(JSON.stringify(diceArray)).toBe(JSON.stringify([0,0,0,0,0]));
    });

    it("5.3: get_sum() should correctly return the sum of valid dice", async () => {
      await page.evaluate('window.dice.set([1, 2, 3, 4, 5], 2);');
      let diceSum1 = await page.evaluate('window.dice.get_sum();')
      expect(diceSum1).toBe(15);
      await page.evaluate('window.dice.set([5, 2, 3, 3, 5], 1);');
      let diceSum2 = await page.evaluate('window.dice.get_sum();')
      expect(diceSum2).toBe(18);
      await page.evaluate('window.dice.set([6, 6, 6, 6, 6], 0);');
      let diceSum3 = await page.evaluate('window.dice.get_sum();')
      expect(diceSum3).toBe(30);
    });

    it("5.4: get_sum() should correctly return the sum of blank dice", async () => {
      await page.evaluate('window.dice.set([0,0,0,0,0], 3);');
      let diceSum = await page.evaluate('window.dice.get_sum();');
      expect(diceSum).toBe(0);
    });

    it("5.5: get_sum() should correctly return the sum of reserved dice", async () => {
      await page.evaluate('window.dice.set([5, 2, 5, 4, 5], 2);');
      let diceSum_before = await page.evaluate('window.dice.get_sum();')
      expect(diceSum_before).toBe(21);

      //Reserve second and third dice
      let die_1 = await page.$('#die_1');
      await die_1.click({clickCount: 2});
      let die_2 = await page.$('#die_2');
      await die_2.click({clickCount: 2});

      let diceSum_after = await page.evaluate('window.dice.get_sum();')
      expect(diceSum_after).toBe(21);
    });

    it("5.6: get_counts() should correctly return the counts of valid dice", async () => {
      await page.evaluate('window.dice.set([1, 2, 3, 4, 5], 2);');  //unique values
      let diceCountArray = await page.evaluate('window.dice.get_counts();')
      let expectedArray = [1, 1, 1, 1, 1, 0]
      expect(JSON.stringify(diceCountArray)).toBe(JSON.stringify(expectedArray));

      await page.evaluate('window.dice.set([6, 2, 3, 3, 6], 1);');//duplicate values
      diceCountArray = await page.evaluate('window.dice.get_counts();')
      expectedArray = [0, 1, 2, 0, 0, 2]
      expect(JSON.stringify(diceCountArray)).toBe(JSON.stringify(expectedArray));
    });

    it("5.7: get_counts() should correctly return the counts of blank dice", async () => {
      await page.evaluate('window.dice.set([0,0,0,0,0], 3);');
      let diceCountArray = await page.evaluate('window.dice.get_counts();')
      let expectedArray = [0, 0, 0, 0, 0, 0]
      expect(JSON.stringify(diceCountArray)).toBe(JSON.stringify(expectedArray));
    });

    it("5.8: get_counts() should correctly return the counts of reserved dice", async () => {
      await page.evaluate('window.dice.set([5, 2, 5, 4, 5], 2);');
      let diceCounts_before = await page.evaluate('window.dice.get_counts();')
      let expectedArray = [0, 1, 0, 1, 3, 0]
      expect(JSON.stringify(diceCounts_before)).toBe(JSON.stringify(expectedArray));

      //Reserve second and third dice
      let die_1 = await page.$('#die_1');
      await die_1.click({clickCount: 2});
      let die_2 = await page.$('#die_2');
      await die_2.click({clickCount: 2});

      let diceCounts_after = await page.evaluate('window.dice.get_counts();')
      expect(JSON.stringify(diceCounts_after)).toBe(JSON.stringify(expectedArray));

    });
  });

  describe('6) Dice- reset() Tests', () => {
    it("6.1: reset() should change dice pictures to blank and rolls remaining to 3", async () => {
      const rollButton = await page.$('#roll_button')
      await rollButton.click();
      await sleep(1100);
      const roll1 = await page.evaluate('window.dice.get_values();');
      let die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      let die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      let die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      let die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      let die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);
      let rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
      expect(rolls_remaining).toBe(2);
      await rollButton.click();
      await sleep(1100);
      const roll2 = await page.evaluate('window.dice.get_values();');
      expect(roll1.toString()).not.toBe(roll2.toString());
      die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBe(-1);
      expect(die1.indexOf("blank")).toBe(-1);
      expect(die2.indexOf("blank")).toBe(-1);
      expect(die3.indexOf("blank")).toBe(-1);
      expect(die4.indexOf("blank")).toBe(-1);
      rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
      expect(rolls_remaining).toBe(1);

      await page.evaluate('window.dice.reset();')
      die0 = await page.evaluate('document.getElementById("die_0").getAttribute("src")');
      die1 = await page.evaluate('document.getElementById("die_1").getAttribute("src")');
      die2 = await page.evaluate('document.getElementById("die_2").getAttribute("src")');
      die3 = await page.evaluate('document.getElementById("die_3").getAttribute("src")');
      die4 = await page.evaluate('document.getElementById("die_4").getAttribute("src")');
      expect(die0.indexOf("blank")).toBeGreaterThan(-1);
      expect(die1.indexOf("blank")).toBeGreaterThan(-1);
      expect(die2.indexOf("blank")).toBeGreaterThan(-1);
      expect(die3.indexOf("blank")).toBeGreaterThan(-1);
      expect(die4.indexOf("blank")).toBeGreaterThan(-1);
      rolls_remaining = await page.evaluate('parseInt(document.getElementById("rolls_remaining").innerHTML)');
      expect(rolls_remaining).toBe(3);
    });
  });

});