# Yahtzee WebApp Demo

## Installation
1. Download and unzip the yahtzee_demo folder
2. Copy your DB server files into db_server
    - wipe_and_create_DB_tables.py is provided. Keep this if you want (see below)
3. Switch into the webapp_server directory to install dependencies
    ```cd webapp_server```
    ```npm install```
4. Start both servers

## Running Tests
1. Tests are included in the /tests folder
2. To run tests, switch to the webapp_server directory
    ```cd webapp_server```
    ```npm run test```

## Quick Starting Both Servers (iOS only)
1. Move the yahtzee_demo folder to your desktop
2. Switch to the yahtzee_demo directory
    ```cd desktop```
    ```cd yahtzee_demo```
2. Make sure you have a wipe_and_create_DB_tables.py in your db_server /models folder
    - If not, remove this line from start_both_servers.sh
3. Run the start_both_servers.sh bash file
    ```sh start_both_servers.sh```