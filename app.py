import asyncio
import json
import random
import time
from typing import Dict, List

from fastapi import FastAPI, WebSocket
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocketDisconnect, WebSocketState

from game import Game, InvalidMove, BotMove

app = FastAPI()


class InvalidWebSocketAction(Exception):
    pass


class PlayerConnection:
    user_id_set = set()

    def __init__(self, websocket, is_bot=False):
        self.websocket = websocket
        self.game_id = None
        self.user_id = None
        self.color = 0
        self.is_bot = is_bot
        self.name = "Bot" if is_bot else None
        self._connected = not is_bot
        self.websocket_last_state_change_time = time.time()

    @property
    def connected(self):
        return self._connected

    @connected.setter
    def connected(self, value: bool):
        self._connected = value
        self.websocket_last_state_change_time = time.time()

    def assign_random_user_id(self):
        generate = lambda: "".join([str(random.randint(0, 9)) for _ in range(8)])
        user_id = generate()
        while user_id in self.user_id_set:
            user_id = generate()
        self.user_id = user_id
        PlayerConnection.user_id_set.add(user_id)

    async def close_connection(self):
        try:
            await self.websocket.close()
        except RuntimeError:
            pass
        except AttributeError:
            pass


class GameRoom:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.game = None
        self.connections: List[PlayerConnection] = []
        self.status = 0
        self.to_be_deleted = False

    def start_game(self):
        if self.to_be_deleted:
            return
        players = []
        for c in self.connections:
            if c.color != 0:
                players.append(c.color)
        if len(players) == 0:
            raise InvalidWebSocketAction("No players in the game")
        self.game = Game(players)
        self.status = 1

    def add_connection(self, connection: PlayerConnection):
        if self.to_be_deleted:
            return
        self.connections.append(connection)
        connection.connected = True

    async def reconnect_connection(self, connection: PlayerConnection, user_id):
        if self.to_be_deleted:
            return
        for c in self.connections:
            if c.user_id == user_id:
                connection.game_id = c.game_id
                connection.user_id = c.user_id
                connection.color = c.color
                connection.name = c.name
                connection.connected = True
                try:
                    await manager.send_status_message(c, "Another connection has been established with the same user_id!")
                except AttributeError:
                    pass
                await c.close_connection()
                self.connections.remove(c)
                self.connections.append(connection)
                return
        raise InvalidWebSocketAction("user_id does not match any player")

    async def disconnect_connection(self, connection: PlayerConnection):
        if self.to_be_deleted:
            return
        if connection not in self.connections:
            return
        await connection.close_connection()
        connection.connected = False
        connection.websocket = None

        async def check_connection_and_turn_into_bot():
            prev_time = connection.websocket_last_state_change_time
            await asyncio.sleep(10)
            if prev_time == connection.websocket_last_state_change_time and not connection.is_bot:
                connection.is_bot = True
                if self.game.players[self.game.turn] == connection.color:
                    # noinspection PyAsyncCall
                    asyncio.create_task(self.check_bot_move())

        # noinspection PyAsyncCall
        asyncio.create_task(check_connection_and_turn_into_bot())

    async def remove_connection(self, connection: PlayerConnection):
        if self.to_be_deleted:
            return
        if connection not in self.connections:
            return
        await connection.close_connection()
        self.connections.remove(connection)
        connection.websocket = None

    def select_color(self, connection: PlayerConnection, color: int):
        if self.to_be_deleted:
            return
        assert connection in self.connections
        if type(color) is not int or 0 > color or color > 6:
            raise InvalidWebSocketAction("Invalid color selected")
        if connection.color == color:
            return
        if color != 0 and color in set([c.color for c in self.connections]):
            raise InvalidWebSocketAction("Another player has already selected this color")
        connection.color = color

    def add_bot(self, color: int):
        if self.to_be_deleted:
            return
        if type(color) is not int or 1 > color or color > 6:
            raise InvalidWebSocketAction("Invalid color selected")
        if color in set([c.color for c in self.connections]):
            raise InvalidWebSocketAction("Another player has already selected this color")
        connection = PlayerConnection(None, is_bot=True)
        connection.color = color
        self.connections.append(connection)

    def remove_bot(self, color: int):
        if self.to_be_deleted:
            return
        if type(color) is not int or 1 > color or color > 6:
            raise InvalidWebSocketAction("Invalid color selected")
        for c in self.connections:
            if c.color == color:
                if not c.is_bot:
                    raise InvalidWebSocketAction("Selected player is not a bot")
                self.connections.remove(c)
                return

    async def check_bot_move(self):
        if self.to_be_deleted:
            return
        assert self.game is not None
        if self.game.get_winner():
            return
        current_color = self.game.players[self.game.turn]
        needs_bot_move = False
        for connection in self.connections:
            needs_bot_move |= (connection.color == current_color and connection.is_bot)
        if not needs_bot_move:
            return
        await asyncio.sleep(1)
        if self.to_be_deleted:
            return
        if current_color != self.game.players[self.game.turn]:
            return
        for connection in self.connections:
            if connection.color == current_color and connection.is_bot:
                self.game.make_moves(BotMove(self.game).get_best_move())
                if self.game.get_winner():
                    self.status = 2
                # noinspection PyAsyncCall
                asyncio.create_task(self.check_bot_move())
                await manager.send_game_state(self.game_id)
                return

    async def check_delete_game(self):
        if self.to_be_deleted:
            return
        websocket_times = []
        for conn in self.connections:
            if conn.connected:
                return
            websocket_times.append(conn.websocket_last_state_change_time)
        await asyncio.sleep(12)
        if self.to_be_deleted:
            return
        for conn in self.connections:
            if conn.connected or conn.websocket_last_state_change_time not in websocket_times:
                return
            websocket_times.remove(conn.websocket_last_state_change_time)
        if len(websocket_times) > 0:
            return
        manager.delete_game_room(self.game_id)


class GameManager:
    def __init__(self):
        self.game_rooms: Dict[str, GameRoom] = {}

    def create_game_room(self):
        generate = lambda: "".join([str(random.randint(0, 9)) for _ in range(8)])
        game_id = generate()
        while game_id in self.game_rooms:
            game_id = generate()
        self.game_rooms[game_id] = GameRoom(game_id)
        return game_id

    def delete_game_room(self, game_id):
        self.game_rooms[game_id].to_be_deleted = True
        del self.game_rooms[game_id]

    async def send_status_message(self, connection: PlayerConnection, message: str):
        await connection.websocket.send_json({"type": "status", "status": message})

    async def send_game_state(self, game_id: str):
        game_room = self.game_rooms[game_id]
        if game_room.status == 0:
            message = {
                "id": game_id,
                "type": "game_state",
                "status": game_room.status,
                "connections": [{"name": c.name,
                                 "color": c.color,
                                 "is_bot": c.is_bot,
                                 "connected": c.connected,
                                 "websocket_last_state_change_time": c.websocket_last_state_change_time}
                                for c in game_room.connections]
            }
        else:
            game = game_room.game
            message = {
                "id": game_id,
                "type": "game_state",
                "board": game.board,
                "players": game.players,
                "turn": game.turn,
                "status": game_room.status,
                "prev_moves": game.prev_moves,
                "connections": [{"name": c.name,
                                 "color": c.color,
                                 "is_bot": c.is_bot,
                                 "connected": c.connected,
                                 "websocket_last_state_change_time": c.websocket_last_state_change_time}
                                for c in game_room.connections]
            }

        async def send_message(connection, message):
            if connection.websocket is None:
                return
            await connection.websocket.send_json(
                {**message, **{"user_id": connection.user_id, "color": connection.color}})

        tasks = [
            send_message(connection, message)
            for connection in self.game_rooms[game_id].connections
        ]
        await asyncio.gather(*tasks)


manager = GameManager()


async def create_game_room(connection: PlayerConnection, data):
    if connection.game_id is not None:
        raise InvalidWebSocketAction("Player is already in a game room")
    if len(data["name"]) not in range(1, 21):
        raise InvalidWebSocketAction("Player name must be between 1 and 20 characters")
    game_id = manager.create_game_room()
    connection.game_id = game_id
    connection.name = data["name"]
    manager.game_rooms[game_id].add_connection(connection)
    connection.assign_random_user_id()
    await manager.send_game_state(game_id)


async def join_game_room(connection: PlayerConnection, data):
    if connection.game_id is not None:
        raise InvalidWebSocketAction("Player is already in a game room")
    if data["game_id"] not in manager.game_rooms:
        raise InvalidWebSocketAction("Game does not exist")
    if len(data["name"]) not in range(1, 21):
        raise InvalidWebSocketAction("Player name must be between 1 and 20 characters")
    game_room = manager.game_rooms[data["game_id"]]
    connection.game_id = game_room.game_id
    connection.name = data["name"]
    game_room.add_connection(connection)
    connection.assign_random_user_id()
    await manager.send_game_state(game_room.game_id)


async def reconnect_game_room(connection: PlayerConnection, data):
    if connection.game_id is not None:
        raise InvalidWebSocketAction("Player is already in a game room")
    if data["game_id"] not in manager.game_rooms:
        raise InvalidWebSocketAction("Reconnection failed")
    game_room = manager.game_rooms[data["game_id"]]
    await game_room.reconnect_connection(connection, data["user_id"])
    await manager.send_game_state(game_room.game_id)


async def select_color(connection: PlayerConnection, data):
    if connection.game_id is None:
        raise InvalidWebSocketAction("Player is not in a game room")
    game_room = manager.game_rooms[connection.game_id]
    if game_room.status != 0:
        raise InvalidWebSocketAction("Game is already in progress")
    game_room.select_color(connection, data["color"])
    await manager.send_game_state(game_room.game_id)


async def disconnect_game_room(connection: PlayerConnection):
    if connection.game_id is None:
        return
    game_room = manager.game_rooms[connection.game_id]
    if game_room.status == 0:
        await game_room.remove_connection(connection)
    else:
        await game_room.disconnect_connection(connection)
    # noinspection PyAsyncCall
    asyncio.create_task(game_room.check_delete_game())
    await manager.send_game_state(game_room.game_id)


async def add_bot(connection: PlayerConnection, data):
    if connection.game_id is None:
        raise InvalidWebSocketAction("Player is not in a game room")
    game_room = manager.game_rooms[connection.game_id]
    if game_room.status != 0:
        raise InvalidWebSocketAction("Game is already in progress")
    game_room.add_bot(data["color"])
    await manager.send_game_state(game_room.game_id)


async def remove_bot(connection: PlayerConnection, data):
    if connection.game_id is None:
        raise InvalidWebSocketAction("Player is not in a game room")
    game_room = manager.game_rooms[connection.game_id]
    if game_room.status != 0:
        raise InvalidWebSocketAction("Game is already in progress")
    game_room.remove_bot(data["color"])
    await manager.send_game_state(game_room.game_id)


async def start_game(connection: PlayerConnection, data):
    if connection.game_id is None:
        raise InvalidWebSocketAction("Player is not in a game room")
    game_room = manager.game_rooms[connection.game_id]
    if game_room.status != 0:
        raise InvalidWebSocketAction("Game is already in progress")
    game_room.start_game()
    # noinspection PyAsyncCall
    asyncio.create_task(game_room.check_bot_move())
    await manager.send_game_state(game_room.game_id)


async def make_move(connection: PlayerConnection, data):
    if connection.game_id is None:
        raise InvalidWebSocketAction("Player is not in a game room")
    game_room = manager.game_rooms[connection.game_id]
    if game_room.status == 0:
        raise InvalidWebSocketAction("Game is not in progress")
    game = manager.game_rooms[connection.game_id].game
    if game.get_winner():
        raise InvalidWebSocketAction("A player has already won the game")
    if game.players[game.turn] != connection.color:
        raise InvalidWebSocketAction("It is not your turn")
    moves = data["moves"]
    if not isinstance(moves, list):
        raise InvalidWebSocketAction("The moves should be a list.")
    if not all(isinstance(move, list) and len(move) == 2 for move in moves):
        raise InvalidWebSocketAction("Each move should be a list of two elements.")
    game.make_moves(moves)
    if game.get_winner():
        game_room.status = 2
    # noinspection PyAsyncCall
    asyncio.create_task(game_room.check_bot_move())
    await manager.send_game_state(game_room.game_id)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connection = PlayerConnection(websocket)
    while websocket.application_state == WebSocketState.CONNECTED:
        try:
            data = await websocket.receive_json()
            if data["type"] == "create":
                await create_game_room(connection, data)
            elif data["type"] == "join":
                await join_game_room(connection, data)
            elif data["type"] == "reconnect":
                await reconnect_game_room(connection, data)
            elif data["type"] == "select_color":
                await select_color(connection, data)
            elif data["type"] == "add_bot":
                await add_bot(connection, data)
            elif data["type"] == "remove_bot":
                await remove_bot(connection, data)
            elif data["type"] == "start":
                await start_game(connection, data)
            elif data["type"] == "move":
                await make_move(connection, data)
            else:
                raise KeyError()
            await manager.send_status_message(connection, "Success")
        except json.JSONDecodeError as e:
            await manager.send_status_message(connection, "JSONDecodeError: " + str(e))
        except KeyError as e:
            await manager.send_status_message(connection, "KeyError: " + str(e))
        except InvalidMove as e:
            await manager.send_status_message(connection, "InvalidMove: " + str(e))
        except InvalidWebSocketAction as e:
            await manager.send_status_message(connection, "InvalidWebSocketAction: " + str(e))
        except WebSocketDisconnect as e:
            break
    await disconnect_game_room(connection)


@app.get("/stats")
async def stats():
    return {"games_running": len(manager.game_rooms)}

app.mount("/", StaticFiles(directory="web/dist", html=True))