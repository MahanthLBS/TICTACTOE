class TicTacToeClient {
    constructor() {
        this.gameId = null;
        this.currentGameState = null;
        this.initializeEventListeners();
        this.startNewGame();
    }

    initializeEventListeners() {
        // Cell click events
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        // Control buttons
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }

    async startNewGame() {
        try {
            const response = await fetch('/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            this.gameId = data.game_id;
            this.currentGameState = data.state;
            
            this.updateGameDisplay();
            this.displayMessage('New game started!', 'success');
            
        } catch (error) {
            console.error('Error starting new game:', error);
            this.displayMessage('Error starting game', 'error');
        }
    }

    async handleCellClick(event) {
        if (!this.gameId) return;

        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Check if move is valid on client side first
        if (this.currentGameState.game_over || this.currentGameState.board[row][col] !== '') {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('row', row);
            formData.append('col', col);

            const response = await fetch(`/move/${this.gameId}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentGameState = data.state;
                this.updateGameDisplay();
                
                if (data.state.winner) {
                    this.displayMessage(`Player ${data.state.winner} wins!`, 'success');
                } else if (data.state.game_over) {
                    this.displayMessage("It's a draw!", 'info');
                }
            } else {
                this.displayMessage('Invalid move', 'error');
            }
            
        } catch (error) {
            console.error('Error making move:', error);
            this.displayMessage('Error making move', 'error');
        }
    }

    async resetGame() {
        if (!this.gameId) return;

        try {
            const response = await fetch(`/reset/${this.gameId}`, {
                method: 'POST'
            });
            
            const data = await response.json();
            this.currentGameState = data.state;
            this.updateGameDisplay();
            this.displayMessage('Game reset!', 'info');
            
        } catch (error) {
            console.error('Error resetting game:', error);
            this.displayMessage('Error resetting game', 'error');
        }
    }

    updateGameDisplay() {
        if (!this.currentGameState) return;

        // Update board
        const board = this.currentGameState.board;
        document.querySelectorAll('.cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const content = cell.querySelector('.cell-content');
            
            content.textContent = board[row][col];
            content.className = 'cell-content';
            
            if (board[row][col] === 'X') {
                content.classList.add('x');
            } else if (board[row][col] === 'O') {
                content.classList.add('o');
            }
        });

        // Update current player
        const playerSymbol = document.getElementById('player-symbol');
        playerSymbol.textContent = this.currentGameState.current_player;
        playerSymbol.className = this.currentGameState.current_player.toLowerCase();

        // Update game info messages
        const currentPlayerEl = document.getElementById('current-player');
        const winnerMessageEl = document.getElementById('winner-message');
        const drawMessageEl = document.getElementById('draw-message');

        if (this.currentGameState.winner) {
            currentPlayerEl.classList.add('hidden');
            winnerMessageEl.classList.remove('hidden');
            document.getElementById('winner-symbol').textContent = this.currentGameState.winner;
            document.getElementById('winner-symbol').className = this.currentGameState.winner.toLowerCase();
        } else if (this.currentGameState.game_over) {
            currentPlayerEl.classList.add('hidden');
            drawMessageEl.classList.remove('hidden');
            winnerMessageEl.classList.add('hidden');
        } else {
            currentPlayerEl.classList.remove('hidden');
            winnerMessageEl.classList.add('hidden');
            drawMessageEl.classList.add('hidden');
        }

        // Update game ID display
        document.getElementById('game-id-display').textContent = this.gameId;
    }

    displayMessage(message, type) {
        // Simple message display - you could enhance this with toast notifications
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Optional: Add visual toast notification
        this.showToast(message, type);
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const bgColors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };

        toast.style.backgroundColor = bgColors[type] || bgColors.info;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.style.opacity = '1', 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeClient();
});