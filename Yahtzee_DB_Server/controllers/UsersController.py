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


def users():
    # Getting information via the query string portion of a URL
    # curl "http://127.0.0.1:5000/fruit/"
    # curl "http://127.0.0.1:5000/fruit?index=0"

    # print(f"request.url={request.url}")
    # print(f"request.url={request.query_string}")
    # print(f"request.url={request.args.get('index')}")

    if request.method == "GET":
        return jsonify(User.get_users()["message"])

    elif request.method == "POST":
        return jsonify(User.create_user(request.json)["message"])
    else:
        return {}


def user_by_username(user_name):
    # print(f"request.url={request.url}")
    # print(f"request.url={request.query_string}")
    # print(f"request.url={request.args.get('index')}")
    if request.method == "GET":
        res = User.get_user(username=user_name)
        return {} if res["result"] == "error" else jsonify(res["message"])

    elif request.method == "PUT":
        res = User.update_user(request.json)
        return {} if res["result"] == "error" else jsonify(res["message"])

    elif request.method == "DELETE":
        res = User.remove_user(username=user_name)
        return {} if res["result"] == "error" else jsonify(res["message"])

    else:
        return {}


def users_games(user_name):
    if request.method == "GET":
        res1 = User.get_user(username=user_name)
        if res1["result"] == "error":
            return []
        res2 = Scorecard.get_game_by_user(res1["message"]["id"])
        print(res2)

        if res2["result"] == "error":
            return []

        else:
            ids = [id[0] for id in res2["message"]]
            return jsonify([Game.get_game(id=game_id)["message"] for game_id in ids])

    else:
        return {}
