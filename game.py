import random
from collections import deque
import copy
from functools import wraps


class InvalidMove(Exception):
    pass


class Game:
    BOARD_SIZE = 17
    LIMITS = [
        (4, 5),
        (4, 6),
        (4, 7),
        (4, 8),
        (0, 13),
        (1, 13),
        (2, 13),
        (3, 13),
        (4, 13),
        (4, 14),
        (4, 15),
        (4, 16),
        (4, 17),
        (9, 13),
        (10, 13),
        (11, 13),
        (12, 13),
    ]
    HOME = {
        1: [
            (4, 0),
            (4, 1),
            (4, 2),
            (4, 3),
            (5, 1),
            (5, 2),
            (5, 3),
            (6, 2),
            (6, 3),
            (7, 3),
        ],
        2: [
            (0, 4),
            (1, 4),
            (1, 5),
            (2, 4),
            (2, 5),
            (2, 6),
            (3, 4),
            (3, 5),
            (3, 6),
            (3, 7),
        ],
        3: [
            (4, 9),
            (4, 10),
            (4, 11),
            (4, 12),
            (5, 10),
            (5, 11),
            (5, 12),
            (6, 11),
            (6, 12),
            (7, 12),
        ],
        4: [
            (9, 13),
            (10, 13),
            (10, 14),
            (11, 13),
            (11, 14),
            (11, 15),
            (12, 13),
            (12, 14),
            (12, 15),
            (12, 16),
        ],
        5: [
            (13, 9),
            (13, 10),
            (13, 11),
            (13, 12),
            (14, 10),
            (14, 11),
            (14, 12),
            (15, 11),
            (15, 12),
            (16, 12),
        ],
        6: [
            (9, 4),
            (10, 4),
            (10, 5),
            (11, 4),
            (11, 5),
            (11, 6),
            (12, 4),
            (12, 5),
            (12, 6),
            (12, 7),
        ],
    }
    DIR = [(-1, -1), (-1, 0), (0, -1), (0, 1), (1, 0), (1, 1)]
    OPPOSITE = {1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3}

    def __init__(self, players):
        self.players = sorted(players)
        self.num_players = len(players)
        self.turn = 0
        self.board = [[0] * self.BOARD_SIZE for _ in range(self.BOARD_SIZE)]
        self.prev_moves = []
        for player in self.players:
            for space in self.HOME[player]:
                self.board[space[0]][space[1]] = player

    @staticmethod
    def valid(x, y):
        return y in range(Game.BOARD_SIZE) and x in range(
            Game.LIMITS[y][0], Game.LIMITS[y][1]
        )

    def valid_and_empty(self, x, y):
        return Game.valid(x, y) and self.board[x][y] == 0

    def valid_and_occupied_by_current_player(self, x, y):
        return Game.valid(x, y) and self.board[x][y] == self.current_player()

    def make_moves(self, moves):
        if self.get_winner():
            raise InvalidMove("A player has already won the game")
        if len(moves) == 0:
            self.prev_moves = moves
            self.next_turn()
            return
        if len(moves) == 1:
            raise InvalidMove("len(moves) cannot be equal to 1")
        if not self.valid_and_occupied_by_current_player(moves[0][0], moves[0][1]):
            raise InvalidMove("The piece is not owned by the current player")
        if ((len(moves) == 2 and self.valid_jump_one_space(moves[0], moves[1])) or
                all(self.valid_jump_two_spaces(moves[i], moves[i + 1]) for i in range(1, len(moves) - 1))):
            self.board[moves[-1][0]][moves[-1][1]] = self.current_player()
            self.board[moves[0][0]][moves[0][1]] = 0
            self.prev_moves = moves
            self.next_turn()
        else:
            raise InvalidMove("Invalid move")

    def valid_jump_one_space(self, location_1, location_2):
        displacement = (location_1[0] - location_2[0], location_1[1] - location_2[1])
        return self.valid_and_empty(location_2[0], location_2[1]) and displacement in Game.DIR

    def valid_jump_two_spaces(self, location_1, location_2):
        displacement = (location_2[0] - location_1[0], location_2[1] - location_1[1])
        if displacement[0] % 2 == 1 or displacement[1] % 2 == 1:
            return False
        displacement = (
            displacement[0] // 2,
            displacement[1] // 2,
        )
        return self.valid_and_empty(location_2[0], location_2[1]) and displacement in self.DIR and \
            self.board[location_1[0] + displacement[0]][location_1[1] + displacement[1]] != 0

    def get_winner(self):
        for player in range(1, 7):
            has_won = True
            for space in self.HOME[player]:
                has_won &= self.board[space[0]][space[1]] == self.OPPOSITE[player]
            if has_won:
                return player
        return 0

    def current_player(self):
        return self.players[self.turn]

    def next_turn(self):
        self.turn += 1
        self.turn %= self.num_players


class BotMove:
    DISTANCE = {}

    def __init__(self, game):
        self.game = copy.deepcopy(game)

    def get_best_move(self):
        best_score = self.calculate_score()
        options = [[]]
        possible_moves = self.get_all_possible_moves()
        for move in possible_moves:
            if len(move) == 0:
                continue
            x1, y1 = move[0]
            x2, y2 = move[-1]
            self.game.board[x1][y1], self.game.board[x2][y2] = self.game.board[x2][y2], self.game.board[x1][y1]
            score = self.calculate_score()
            if score < best_score:
                best_score = score
                options = []
            if score == best_score:
                options.append(move)
            self.game.board[x1][y1], self.game.board[x2][y2] = self.game.board[x2][y2], self.game.board[x1][y1]
        return random.choice(options)

    def get_all_possible_moves(self):
        possible_moves = []
        for x in range(0, self.game.BOARD_SIZE):
            for y in range(0, self.game.BOARD_SIZE):
                if self.game.valid_and_occupied_by_current_player(x, y):
                    tmp = self.get_possible_moves_from_location((x, y))
                    possible_moves.extend(tmp)
        return possible_moves

    def get_possible_moves_from_location(self, location):
        back = [[(-1, -1)] * self.game.BOARD_SIZE for _ in range(self.game.BOARD_SIZE)]
        back[location[0]][location[1]] = location
        dq = deque()
        dq.append(location)
        while len(dq) > 0:
            node = dq.popleft()
            for d in self.game.DIR:
                new_x = node[0] + d[0] * 2
                new_y = node[1] + d[1] * 2
                if self.game.valid_jump_two_spaces(node, (new_x, new_y)) and back[new_x][new_y] == (-1, -1):
                    back[new_x][new_y] = node
                    dq.append((new_x, new_y))
        for d in self.game.DIR:
            new_x = location[0] + d[0]
            new_y = location[1] + d[1]
            if self.game.valid_jump_one_space(location, (new_x, new_y)) and back[new_x][new_y] == (-1, -1):
                back[new_x][new_y] = location
        possible_moves = []
        for i in range(self.game.BOARD_SIZE):
            for j in range(self.game.BOARD_SIZE):
                if back[i][j] == (-1, -1) or (i, j) == location:
                    continue
                curr_x = i
                curr_y = j
                move = []
                while curr_x != location[0] or curr_y != location[1]:
                    move.append((curr_x, curr_y))
                    curr_x, curr_y = back[curr_x][curr_y]
                move.append((curr_x, curr_y))
                move.reverse()
                possible_moves.append(move)
        return possible_moves

    def calculate_score(self):
        player = self.game.current_player()
        player_locations = []
        for i in range(0, self.game.BOARD_SIZE):
            for j in range(0, self.game.BOARD_SIZE):
                if self.game.board[i][j] == player:
                    player_locations.append((i, j))
        weights = [[0] * 11 for _ in range(11)]
        for i in range(10):
            for j in range(10):
                home_location = self.game.HOME[self.game.OPPOSITE[player]][i]
                player_location = player_locations[j]
                weights[i + 1][j + 1] = BotMove.DISTANCE[home_location][player_location]
        INF = float('inf')
        u = [0] * 11
        v = [0] * 11
        p = [0] * 11
        way = [0] * 11
        for i in range(1, 11):
            p[0] = i
            j0 = 0
            minv = [INF] * 11
            used = [False] * 11
            while True:
                used[j0] = True
                i0 = p[j0]
                delta = INF
                j1 = 0
                for j in range(1, 11):
                    if not used[j]:
                        cur = weights[i0][j] - u[i0] - v[j]
                        if cur < minv[j]:
                            minv[j] = cur
                            way[j] = j0
                        if minv[j] < delta:
                            delta = minv[j]
                            j1 = j
                for j in range(11):
                    if used[j]:
                        u[p[j]] += delta
                        v[j] -= delta
                    else:
                        minv[j] -= delta
                j0 = j1
                if p[j0] == 0:
                    break
            while j0:
                j1 = way[j0]
                p[j0] = p[j1]
                j0 = j1
        score = 0
        for j in range(1, 11):
            score += weights[p[j]][j] ** 1.4
        for i in range(10):
            for j in range(10):
                score += BotMove.DISTANCE[player_locations[i]][player_locations[j]] / (10 * self.game.num_players)
        return int(score)


def callonce(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not wrapper.called:
            wrapper.called = True
            return f(*args, **kwargs)

    wrapper.called = False
    return wrapper


@callonce
def precompute_distances():
    for y in range(0, Game.BOARD_SIZE):
        for x in range(Game.LIMITS[y][0], Game.LIMITS[y][1]):
            BotMove.DISTANCE[(x, y)] = {}
            visited = [[False] * Game.BOARD_SIZE for _ in range(Game.BOARD_SIZE)]
            visited[x][y] = True
            dq = deque()
            dq.append((x, y))
            dist = 0
            while len(dq) > 0:
                for _ in range(len(dq)):
                    node = dq.popleft()
                    BotMove.DISTANCE[(x, y)][node] = dist
                    for d in Game.DIR:
                        new_x = node[0] + d[0]
                        new_y = node[1] + d[1]
                        if not Game.valid(new_x, new_y) or visited[new_x][new_y]:
                            continue
                        visited[new_x][new_y] = True
                        dq.append((new_x, new_y))
                dist += 1


precompute_distances()
