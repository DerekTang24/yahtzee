from flask import jsonify
from flask import request
import os
import sys
from models import GamesModel, ScorecardsModel, UsersModel

yahtzee_db_name = f"{os.getcwd()}/models/yahtzeeDB.db"
print("test_UsersController DB location:", yahtzee_db_name)
User = UsersModel.User(yahtzee_db_name)
Game = GamesModel.Game(yahtzee_db_name)
Scorecard = ScorecardsModel.Scorecard(yahtzee_db_name)


def games():
    # Getting information via the query string portion of a URL
    # curl "http://127.0.0.1:5000/fruit/"
    # curl "http://127.0.0.1:5000/fruit?index=0"

    # print(f"request.url={request.url}")
    # print(f"request.url={request.query_string}")
    # print(f"request.url={request.args.get('index')}")

    if request.method == "GET":
        return jsonify(Game.get_games()["message"])

    elif request.method == "POST":
        return jsonify(Game.create_game(request.json)["message"])
    else:
        return {}


def game_by_name(game_name):
    # print(f"request.url={request.url}")
    # print(f"request.url={request.query_string}")
    # print(f"request.url={request.args.get('index')}")
    if request.method == "GET":
        res = Game.get_game(name=game_name)
        return {} if res["result"] == "error" else jsonify(res["message"])

    elif request.method == "PUT":
        res = Game.update_game(request.json)
        return {} if res["result"] == "error" else jsonify(res["message"])

    elif request.method == "DELETE":
        res = Game.remove_game(name=game_name)
        return {} if res["result"] == "error" else jsonify(res["message"])

    else:
        return {}


def games_scorecard(game_name):
    if request.method == "GET":
        res1 = Game.get_game(name=game_name)
        if res1["result"] == "error":
            return []
        res2 = Scorecard.get_game_scorecards(id=res1["message"]["id"])

        if res2["result"] == "error":
            return []

        else:
            return jsonify(res2["message"])
