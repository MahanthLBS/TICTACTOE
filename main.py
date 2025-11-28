from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from typing import Dict, Optional
import json

app = FastAPI(title="Tic Tac Toe")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class TicTacToeGame:
    def __init__(self):
        self.board = [['' for _ in range(3)] for _ in range(3)]
        self.current_player = 'X'
        self.winner = None
        self.game_over = False
        self.moves = 0
    
    def make_move(self, row: int, col: int) -> bool:
        if self.game_over or self.board[row][col] != '':
            return False
        
        self.board[row][col] = self.current_player
        self.moves += 1
        
        if self.check_winner(row, col):
            self.winner = self.current_player
            self.game_over = True
        elif self.moves == 9:
            self.game_over = True
        else:
            self.current_player = 'O' if self.current_player == 'X' else 'X'
        
        return True
    
    def check_winner(self, row: int, col: int) -> bool:
        # Check row
        if all(self.board[row][c] == self.current_player for c in range(3)):
            return True
        
        # Check column
        if all(self.board[r][col] == self.current_player for r in range(3)):
            return True
        
        # Check diagonals
        if row == col and all(self.board[i][i] == self.current_player for i in range(3)):
            return True
        
        if row + col == 2 and all(self.board[i][2-i] == self.current_player for i in range(3)):
            return True
        
        return False
    
    def reset(self):
        self.__init__()
    
    def get_state(self) -> Dict:
        return {
            'board': self.board,
            'current_player': self.current_player,
            'winner': self.winner,
            'game_over': self.game_over,
            'moves': self.moves
        }

# Store games in memory (in production, use a database)
games: Dict[str, TicTacToeGame] = {}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/start")
async def start_game():
    import uuid
    game_id = str(uuid.uuid4())
    games[game_id] = TicTacToeGame()
    return {"game_id": game_id, "state": games[game_id].get_state()}

@app.post("/move/{game_id}")
async def make_move(game_id: str, row: int = Form(...), col: int = Form(...)):
    if game_id not in games:
        return {"error": "Game not found"}
    
    game = games[game_id]
    success = game.make_move(row, col)
    
    return {
        "success": success,
        "state": game.get_state()
    }

@app.post("/reset/{game_id}")
async def reset_game(game_id: str):
    if game_id not in games:
        return {"error": "Game not found"}
    
    games[game_id].reset()
    return {"state": games[game_id].get_state()}

@app.get("/state/{game_id}")
async def get_game_state(game_id: str):
    if game_id not in games:
        return {"error": "Game not found"}
    
    return {"state": games[game_id].get_state()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)