import sqlite3
import random
import os
import re
import datetime


class Game:
    def __init__(self, db_name):
        self.db_name = db_name
        self.table_name = "games"

    def initialize_games_table(self):
        db_connection = sqlite3.connect(self.db_name)
        cursor = db_connection.cursor()
        schema = f"""
                CREATE TABLE {self.table_name} (
                    id INTEGER PRIMARY KEY UNIQUE,
                    name TEXT UNIQUE,
                    link TEXT UNIQUE,
                    created TIMESTAMP,
                    finished TIMESTAMP

                )
                """
        cursor.execute(f"DROP TABLE IF EXISTS {self.table_name};")
        results = cursor.execute(schema)
        db_connection.close()

    def create_game(self, game_details):
        try:
            print("game details", game_details)
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            if (
                set(game_details.keys()) != set(["name", "name"])
                or not re.match("^[A-Za-z0-9]*$", game_details["name"])
                or not re.match(
                    "^[A-Za-z0-9]*$",
                    game_details["name"],
                )
            ):
                return {
                    "result": "error",
                    "message": "game details is of the wrong format",
                }

            game_id = random.randint(
                0, 9223372036854775807
            )  # non-negative range of SQLITE3 INTEGER
            # check to see if exists already!!
            while self.exists(id=game_id)["message"]:
                game_id = random.randint(
                    0, 9223372036854775807
                )  # non-negative range of SQLITE3 INTEGER

            time = datetime.datetime.now()
            game_data = (
                game_id,
                game_details["name"],
                game_details["name"],
                time,
                time,
            )
            # are you sure you have all data in the correct format?
            cursor.execute(
                f"INSERT INTO {self.table_name} VALUES (?, ?, ?, ?, ?);", game_data
            )
            db_connection.commit()
            query = f"SELECT * from {self.table_name};"
            results = cursor.execute(query)

            return {"result": "success", "message": self.oneToDict(game_data)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_game(self, id=None, name=None):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            if id and name:
                return {
                    "result": "error",
                    "message": "Input EXATCLY ONE game_id or name",
                }

            if id:
                query = (
                    f"SELECT * from {self.table_name} WHERE {self.table_name}.id={id};"
                )
            elif name:
                query = f"SELECT * from {self.table_name} WHERE {self.table_name}.name='{name}';"
            results = cursor.execute(query)
            res = results.fetchone()
            if not res:
                return {"result": "error", "message": "No such game"}

            return {"result": "success", "message": self.oneToDict(res)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_games(self):
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

    def exists(self, id=None, name=None):
        try:
            if id and name:
                return {
                    "result": "error",
                    "message": "Input EXATCLY ONE game_id or name",
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

    def update_game(self, game_info):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            if not self.exists(id=game_info["id"])["message"]:
                return {"result": "error", "message": "game does not exist"}
            full_game_data = self.get_game(id=game_info["id"])["message"]
            new_game_data = (
                game_info["name"],
                game_info["link"],
                full_game_data["created"],
                game_info["finished"]
                if "finished" in game_info
                else full_game_data["created"],
                full_game_data["id"],
            )
            query = f""" UPDATE {self.table_name}
                SET name= ? ,
                link= ? ,
                created= ? ,
                finished= ?
                WHERE {self.table_name}.id= ? ;
                """
            results = cursor.execute(query, new_game_data)
            db_connection.commit()
            res = self.get_game(id=game_info["id"])
            return {"result": "success", "message": res["message"]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def remove_game(self, name):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            res = self.get_game(name=name)
            if not self.exists(name=name)["message"]:
                return {"result": "error", "message": "game does not exist"}

            query = (
                f"DELETE FROM {self.table_name} WHERE {self.table_name}.name='{name}';"
            )
            results = cursor.execute(query)
            db_connection.commit()
            return {"result": "success", "message": res["message"]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def oneToDict(self, tup):
        return {
            "id": tup[0],
            "name": tup[1],
            "link": tup[2],
            "created": str(tup[3]),
            "finished": str(tup[4]),
        }

    def manyToDict(self, arr):
        out = []
        for tup in arr:
            out.append(
                {
                    "id": tup[0],
                    "name": tup[1],
                    "link": tup[2],
                    "created": str(tup[3]),
                    "finished": str(tup[4]),
                }
            )

        return out
