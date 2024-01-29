const fetch = require('node-fetch');

users = []
users.push({
    username:"luigitest314",
    email:"luigitest314@gmail.com",
    password:"aB12345678"
    });
users.push({
    username:"mariotest314",
    email:"mariotest314@gmail.com",
    password:"aB12345678"
    });
users.push({
    username:"toadtest314",
    email:"toadtest314@gmail.com",
    password:"aB12345678"
    });
users.push({
    username:"princesstest314",
    email:"princesstest314@gmail.com",
    password:"aB12345678"
    });
users.push({
    username:"shyguytest314",
    email:"shyguytest314@gmail.com",
    password:"aB12345678"
    });
users.push({
    username:"bowsertest314",
    email:"bowsertest314@gmail.com",
    password:"aB12345678"
    });

async function add_users_to_DB(n){
    if (n>6) n = 6;

    const url = 'http://127.0.0.1:5000/users'
    const headers = {"Content-Type": "application/json"}
    added_users=[]
    for (let i=0; i<n; i++){
        let res = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(users[i]),
        });
        text = await res.text()
        let user_details = JSON.parse(text);
        added_users.push(user_details)
    }

    return added_users
}

async function delete_all_users_from_DB(){
    let url = 'http://127.0.0.1:5000/users';
    let res= await fetch(url);
    let all_users = JSON.parse(await res.text());

    for (let user of all_users){
        let url = 'http://127.0.0.1:5000/users/'+user["username"];
        await fetch(url, {
            method: "DELETE"
        });
    }
}

async function add_1_player_games(users, num_games_per_user){
    game_names = {} 
    let game_url = 'http://127.0.0.1:5000/games';
    let scorecard_url = 'http://127.0.0.1:5000/scorecards';
    const headers = {"Content-Type": "application/json"}
    let scorecard_ids=[]
    for (let user of users){
        game_names[user["username"]] = []
        for (let i=1; i<=num_games_per_user; i++ ){
            new_game={
                "name":user["username"]+"game"+i
            }
            let res1 = await fetch(game_url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(new_game)
            });

            let game_details = JSON.parse(await res1.text());
            game_names[user["username"]].push(game_details["name"])
            new_scorecard={
                "game_id":game_details["id"],
                "user_id":user["id"],
                "turn_order":1
            }
            let res2 = await fetch(scorecard_url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(new_scorecard)
            });
            let card_details = JSON.parse(await res2.text());

            scorecard_ids.push(card_details["id"])
        }
    }

    return game_names
}

async function delete_all_scorecards_from_DB(){
    let url = 'http://127.0.0.1:5000/scorecards';
    let res= await fetch(url);
    let all_cards = JSON.parse(await res.text());
    
    for (let card of all_cards){
        let url = 'http://127.0.0.1:5000/scorecards/'+card["id"];
        await fetch(url, {
            method: "DELETE"
        });
    }
}
async function delete_all_games_from_DB(game_names){
    let url = 'http://127.0.0.1:5000/games';
    let res= await fetch(url);
    let all_games = JSON.parse(await res.text());
    for (let game of all_games){
        let url = 'http://127.0.0.1:5000/games/'+game["name"];
        await fetch(url, {
            method: "DELETE"
        });
    }
}

module.exports = {add_users_to_DB, add_1_player_games, delete_all_scorecards_from_DB, delete_all_games_from_DB, delete_all_users_from_DB }
