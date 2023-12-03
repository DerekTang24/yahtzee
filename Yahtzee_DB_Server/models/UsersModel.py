import sqlite3
import random
import os
import re


class User:
    def __init__(self, db_name):
        self.db_name = db_name
        self.table_name = "users"

    def initialize_users_table(self):
        db_connection = sqlite3.connect(self.db_name)
        cursor = db_connection.cursor()
        schema = f"""
                CREATE TABLE {self.table_name} (
                    id INTEGER PRIMARY KEY UNIQUE,
                    email TEXT UNIQUE,
                    username TEXT UNIQUE,
                    password TEXT
                )
                """
        cursor.execute(f"DROP TABLE IF EXISTS {self.table_name};")
        results = cursor.execute(schema)
        db_connection.close()

    def create_user(self, user_details):
        try:
            print(user_details)
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            user_copy = dict(user_details)
            if (
                set(user_copy.keys()) != set(["email", "username", "password"])
                or "@" not in user_copy["email"]
                or user_copy["email"][-4] != "."
                or re.compile("[_!#$%^&*()<>?/\|}{~:]").search(user_copy["email"])
                or re.compile("[_!#$%^&*()<>?/\|}{~:]").search(user_copy["username"])
            ):
                return {
                    "result": "error",
                    "message": "User details is of the wrong format",
                }

            user_id = random.randint(
                0, 9223372036854775807
            )  # non-negative range of SQLITE3 INTEGER
            # check to see if exists already!!
            while self.exists(id=user_id)["message"]:
                user_id = random.randint(
                    0, 9223372036854775807
                )  # non-negative range of SQLITE3 INTEGER
            user_data = (
                user_id,
                user_copy["email"],
                user_copy["username"],
                user_copy["password"],
            )
            # are you sure you have all data in the correct format?
            cursor.execute(
                f"INSERT INTO {self.table_name} VALUES (?, ?, ?, ?);", user_data
            )
            db_connection.commit()
            query = f"SELECT * from {self.table_name};"
            results = cursor.execute(query)
            user_copy["id"] = user_id

            return {"result": "success", "message": user_copy}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_user(self, id=None, username=None):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()

            if id and username:
                return {
                    "result": "error",
                    "message": "Input EXATCLY ONE user_id or username",
                }

            if id:
                query = (
                    f"SELECT * from {self.table_name} WHERE {self.table_name}.id={id};"
                )
            elif username:
                query = f"SELECT * from {self.table_name} WHERE {self.table_name}.username='{username}';"
            results = cursor.execute(query)
            res = results.fetchone()
            if not res:
                return {"result": "error", "message": "No such user"}

            return {"result": "success", "message": self.oneToDict(res)}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def get_users(self):
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

    def exists(self, id=None, username=None):
        try:
            if id and username:
                return {
                    "result": "error",
                    "message": "Input EXATCLY ONE user_id or username",
                }

            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            if id:
                query = (
                    f"SELECT * from {self.table_name} WHERE {self.table_name}.id={id};"
                )
            elif username:
                query = f"SELECT * from {self.table_name} WHERE {self.table_name}.username='{username}';"
            results = cursor.execute(query)
            res = results.fetchone()

            return {"result": "success", "message": res != None}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def update_user(self, user_info):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            if not self.exists(id=user_info["id"])["message"]:
                return {"result": "error", "message": "User does not exist"}
            new_user_data = (
                user_info["email"],
                user_info["username"],
                user_info["password"],
                user_info["id"],
            )
            query = f""" UPDATE {self.table_name}
                SET email= ? ,
                username= ? ,
                password= ?
                WHERE {self.table_name}.id= ? ;
                """
            results = cursor.execute(query, new_user_data)
            db_connection.commit()
            res = self.get_user(id=user_info["id"])
            return {"result": "success", "message": res["message"]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def remove_user(self, username):
        try:
            db_connection = sqlite3.connect(self.db_name)
            cursor = db_connection.cursor()
            res = self.get_user(username=username)
            if not self.exists(username=username)["message"]:
                return {"result": "error", "message": "User does not exist"}

            query = f"DELETE FROM {self.table_name} WHERE {self.table_name}.username='{username}';"
            results = cursor.execute(query)
            db_connection.commit()
            return {"result": "success", "message": res["message"]}

        except sqlite3.Error as error:
            return {"result": "error", "message": error}

        finally:
            db_connection.close()

    def oneToDict(self, tup):
        return {"id": tup[0], "email": tup[1], "username": tup[2], "password": tup[3]}

    def manyToDict(self, arr):
        out = []
        for tup in arr:
            out.append(
                {"id": tup[0], "email": tup[1], "username": tup[2], "password": tup[3]}
            )

        return out
