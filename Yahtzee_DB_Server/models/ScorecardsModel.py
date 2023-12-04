import sqlite3
import random
import os
import re
import datetime
import json


class Scorecard:
    def __init__(self, db_name):
        self.db_name = db_name
        self.table_name = "scorecards"

    def initialize_scorecards_table(self):
        db_connection = sqlite3.connect(self.db_name)
        cursor = db_connection.cursor()
        schema = f"""
                CREATE TABLE {self.table_name} (
                    id INTEGER PRIMARY KEY UNIQUE,
                    game_id INTEGER,
                    user_id INTEGER,
                    score_info TEXT,
                    turn_order INT,
                    score INT

                )
                """
        cursor.execute(f"DROP TABLE IF EXISTS {self.table_name};")
        results = cursor.execute(schema)
        db_connection.close()

    def create_scorecard(self, game_id, user_id, order):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            score_info = {
                "dice_rolls": 0,
                "upper": {
                    "ones": -1,
                    "twos": -1,
                    "threes": -1,
                    "fours": -1,
                    "fives": -1,
                    "sixes": -1,
                },
                "lower": {
                    "three_of_a_kind": -1,
                    "four_of_a_kind": -1,
                    "full_house": -1,
                    "small_straight": -1,
                    "large_straight": -1,
                    "yahtzee": -1,
                    "chance": -1,
                },
            }
            if (
                sum(
                    [
                        1
                        for i in self.get_scorecards()["message"]
                        if i["game_id"] == game_id
                    ]
                )
                >= 4
            ):
                return {
                    "result": "error",
                    "message": "Can only create 4 scorecards",
                }
            elif user_id in [
                i["user_id"]
                for i in self.get_scorecards()["message"]
                if i["game_id"] == game_id
            ]:
                return {
                    "result": "error",
                    "message": "That user is already in the game",
                }

            scorecard_id = random.randint(
                0, 9007199254740991
            )  # non-negative range of SQLITE3 INTEGER
            # check to see if exists already!!
            while self.exists(id=scorecard_id)["message"]:
                scorecard_id = random.randint(
                    0, 9007199254740991
                )  # non-negative range of SQLITE3 INTEGER

            scorecard_data = (
                scorecard_id,
                game_id,
                user_id,
                json.dumps(score_info),
                order,
                0,
            )
            # are you sure you have all data in the correct format?
            cursor.execute(
                f"INSERT INTO {self.table_name} VALUES (?, ?, ?, ?, ?, ?);",
                scorecard_data,
            )
            db_connection.commit()
            query = f"SELECT * from {self.table_name};"
            results = cursor.execute(query)

            return {"result": "success", "message": self.oneToDict(scorecard_data)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_scorecard(self, id=None):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            query = f"SELECT * from {self.table_name} WHERE {self.table_name}.id={id};"
            results = cursor.execute(query)
            res = results.fetchone()
            if not res:
                return {"result": "error", "message": "No such scorecard"}

            return {"result": "success", "message": self.oneToDict(res)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_game_scorecards(self, id=None):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            query = (
                f"SELECT * from {self.table_name} WHERE {self.table_name}.game_id={id};"
            )

            results = cursor.execute(query)
            res = results.fetchall()
            return {"result": "success", "message": self.manyToDict(res)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_scorecards(self):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            query = f"SELECT * from {self.table_name};"
            results = cursor.execute(query)
            res = results.fetchall()

            return {"result": "success", "message": self.manyToDict(res)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_game_by_user(self, user_id):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            query = f"SELECT game_id from {self.table_name} WHERE {self.table_name}.user_id={user_id};"
            results = cursor.execute(query)
            res = results.fetchall()

            if res:
                return {"result": "success", "message": res}

            else:
                return {"result": "error", "message": "User has no games"}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_scorecards_by_user(self, user_id):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            query = f"SELECT * from {self.table_name} WHERE {self.table_name}.user_id={user_id};"
            results = cursor.execute(query)
            res = results.fetchall()

            if res:
                return {"result": "success", "message": self.manyToDict(res)}

            else:
                return {"result": "error", "message": "User has no scorecards"}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def exists(self, id=None, name=None):
        try:
            if id and name:
                return {
                    "result": "error",
                    "message": "Input EXATCLY ONE scorecard_id or name",
                }

            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            if id:
                query = (
                    f"SELECT * from {self.table_name} WHERE {self.table_name}.id={id};"
                )
            elif name:
                query = f"SELECT * from {self.table_name} WHERE {self.table_name}.name='{name}';"
            results = cursor.execute(query)
            res = results.fetchone()

            return {"result": "success", "message": res != None}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def is_finished(self, name):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            query = f"SELECT * from {self.table_name} WHERE {self.table_name}.name='{name}';"
            results = cursor.execute(query)
            res = results.fetchone()

            return {"result": "success", "message": res[3] != res[4]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def update_scorecard(self, id, score_info):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            if not self.exists(id=id)["message"]:
                return {"result": "error", "message": "scorecard does not exist"}

            new_scorecard_data = (
                json.dumps(score_info),
                self.get_score(score_info),
                id,
            )
            query = f""" UPDATE {self.table_name}
                SET score_info = ?,
                score = ?
                WHERE {self.table_name}.id= ? ;
                """
            results = cursor.execute(query, new_scorecard_data)
            db_connection.commit()
            res = self.get_scorecard(id=id)
            return {"result": "success", "message": res["message"]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def remove_scorecard(self, id):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            res = self.get_scorecard(id=id)
            if not self.exists(id=id)["message"]:
                return {"result": "error", "message": "scorecard does not exist"}

            query = f"DELETE FROM {self.table_name} WHERE {self.table_name}.id='{id}';"
            results = cursor.execute(query)
            db_connection.commit()
            return {"result": "success", "message": res["message"]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_score(self, score_info):
        upper = sum(value for key, value in score_info["upper"].items() if value != -1)
        lower = sum(value for key, value in score_info["lower"].items() if value != -1)

        return upper + lower

    def oneToDict(self, tup):
        return {
            "id": tup[0],
            "game_id": tup[1],
            "user_id": tup[2],
            "score_info": json.loads(tup[3]),
            "turn_order": tup[4],
            "score": tup[5],
        }

    def manyToDict(self, arr):
        out = []
        for tup in arr:
            out.append(
                {
                    "id": tup[0],
                    "game_id": tup[1],
                    "user_id": tup[2],
                    "score_info": json.loads(tup[3]),
                    "turn_order": tup[4],
                    "score": tup[5],
                }
            )

        return out
