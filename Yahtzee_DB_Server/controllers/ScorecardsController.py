from flask import jsonify
from flask import request
import os
import sys
import heapq
from models import GamesModel, ScorecardsModel, UsersModel

yahtzee_db_name = f"{os.getcwd()}/models/yahtzeeDB.db"
print("test_UsersController DB location:", yahtzee_db_name)
User = UsersModel.User(yahtzee_db_name)
Game = GamesModel.Game(yahtzee_db_name)
Scorecard = ScorecardsModel.Scorecard(yahtzee_db_name)


def scorecards():
    # Getting information via the query string portion of a URL
    # curl "http://127.0.0.1:5000/fruit/"
    # curl "http://127.0.0.1:5000/fruit?index=0"

    # print(f"request.url={request.url}")
    # print(f"request.url={request.query_string}")
    # print(f"request.url={request.args.get('index')}")

    if request.method == "GET":
        return jsonify(Scorecard.get_scorecards()["message"])

    elif request.method == "POST":
        print(request.json)
        return jsonify(
            Scorecard.create_scorecard(
                request.json["game_id"],
                request.json["user_id"],
                request.json["turn_order"],
            )["message"]
        )
    else:
        return {}


def scorecard_by_scorecard_id(scorecard_id):
    # print(f"request.url={request.url}")
    # print(f"request.url={request.query_string}")
    # print(f"request.url={request.args.get('index')}")
    if request.method == "GET":
        res = Scorecard.get_scorecard(id=scorecard_id)
        return {} if res["result"] == "error" else jsonify(res["message"])

    elif request.method == "PUT":
        res = Scorecard.update_scorecard(id=scorecard_id, score_info=request.json)
        return {} if res["result"] == "error" else jsonify(res["message"])

    elif request.method == "DELETE":
        res = Scorecard.remove_scorecard(id=scorecard_id)
        return {} if res["result"] == "error" else jsonify(res["message"])

    else:
        return {}


def scorecards_game(scorecard_id):
    if request.method == "GET":
        res1 = Scorecard.get_scorecard(id=scorecard_id)
        if res1["result"] == "error":
            return {}
        res2 = Game.get_game(res1["message"]["game_id"])

        if res2["result"] == "error":
            return {}

        else:
            return jsonify(res2["message"])

    else:
        return {}


def scores():
    if request.method == "GET":
        res = Scorecard.get_scorecards()["message"]
        if not res:
            return []
        largest = heapq.nlargest(10, res, key=lambda e: e["score"])
        return jsonify(
            [
                {
                    "score": scorecard["score"],
                    "game_name": Game.get_game(id=scorecard["game_id"])["message"][
                        "name"
                    ],
                    "username": User.get_user(id=scorecard["user_id"])["message"][
                        "username"
                    ],
                }
                for scorecard in largest
            ]
        )

    else:
        return {}


def scores_user(username):
    if request.method == "GET":
        res = Scorecard.get_scorecards_by_user(
            user_id=User.get_user(username=username)["message"]["id"]
        )
        if not res["message"] or res["result"] == "error":
            return []
        largest = sorted(res["message"], key=lambda e: e["score"], reverse=True)
        return jsonify(
            [
                {
                    "score": scorecard["score"],
                    "game_name": Game.get_game(id=scorecard["game_id"])["message"][
                        "name"
                    ],
                    "username": username,
                }
                for scorecard in largest
            ]
        )
    else:
        return {}
