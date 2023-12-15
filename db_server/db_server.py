# Name: Derek Tang
# Date: Nov 1, 2023
# Class: CS Topics
import os
from flask import Flask
from flask import request
import sys

from controllers import UsersController, GamesController, ScorecardsController
from models import GamesModel, ScorecardsModel, UsersModel

yahtzee_db_name = f"{os.getcwd()}/models/yahtzeeDB.db"
print("test_UsersController DB location:", yahtzee_db_name)
User = UsersModel.User(yahtzee_db_name)
Game = GamesModel.Game(yahtzee_db_name)
Scorecard = ScorecardsModel.Scorecard(yahtzee_db_name)

app = Flask(__name__, static_url_path="", static_folder="static")

app.add_url_rule("/users", view_func=UsersController.users, methods=["POST", "GET"])
app.add_url_rule(
    "/users/<user_name>",
    view_func=UsersController.user_by_username,
    methods=["PUT", "GET", "DELETE"],
)
app.add_url_rule(
    "/users/games/<user_name>", view_func=UsersController.users_games, methods=["GET"]
)


app.add_url_rule("/games", view_func=GamesController.games, methods=["POST", "GET"])
app.add_url_rule(
    "/games/<game_name>",
    view_func=GamesController.game_by_name,
    methods=["PUT", "GET", "DELETE"],
)
app.add_url_rule(
    "/games/scorecards/<game_name>",
    view_func=GamesController.games_scorecard,
    methods=["GET"],
)
app.add_url_rule(
    "/scorecards", view_func=ScorecardsController.scorecards, methods=["POST", "GET"]
)
app.add_url_rule(
    "/scorecards/<scorecard_id>",
    view_func=ScorecardsController.scorecard_by_scorecard_id,
    methods=["PUT", "GET", "DELETE"],
)
app.add_url_rule(
    "/scorecards/game/<scorecard_id>",
    view_func=ScorecardsController.scorecards_game,
    methods=["GET"],
)
app.add_url_rule(
    "/scores",
    view_func=ScorecardsController.scores,
    methods=["GET"],
)
app.add_url_rule(
    "/scores/<username>",
    view_func=ScorecardsController.scores_user,
    methods=["GET"],
)

app.run(debug=True, port=5000)
