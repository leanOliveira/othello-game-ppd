document.addEventListener('DOMContentLoaded', () => {
  const board = document.getElementById('game-board');
  const size = 8;
  let currentPlayer = 'black';
  let clientColor = null;
  let isGameStarted = false;

  const socket = new WebSocket('ws://localhost:8080/ws');

  socket.onopen = () => {
    console.log('Conexão WebSocket estabelecida');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Mensagem recebida do servidor:', data);
    if (data.type === 'error') {
      alert(data.message);
      socket.close();
      return;
    }
    if (data.type === 'color') {
      clientColor = data.color;
      document.getElementById(
        'player-color'
      ).textContent = `Você está jogando como: ${
        clientColor === 'black' ? 'Preto' : 'Branco'
      }`;
      console.log('Sua cor é:', clientColor);
    }
    if (data.type === 'start') {
      isGameStarted = true;
      alert(data.message);
      updateBoard(data.board);
    }
    if (data.type === 'update') {
      updateBoard(data.board);
      currentPlayer = data.currentPlayer;
      updateTurnIndicator();
      console.log(`Vez do jogador: ${currentPlayer}`);
    }
    if (data.type === 'winner') {
      document.getElementById('message').textContent = data.message;
      console.log(`Resultado do jogo: ${data.message}`);
    }
  };

  const createBoard = () => {
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.index = i;
      cell.addEventListener('click', handleMove);
      board.appendChild(cell);
    }
  };

  const handleMove = (event) => {
    if (!isGameStarted) {
      alert('Aguardando outro jogador se conectar.');
      return;
    }
    if (currentPlayer !== clientColor) {
      alert('Não é a sua vez.');
      return;
    }
    const cell = event.target.closest('.cell');
    const index = parseInt(cell.dataset.index, 10);
    console.log(`Enviando movimento: ${index}`);
    socket.send(JSON.stringify({ type: 'move', move: index }));
  };

  const updateBoard = (boardState) => {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
      cell.innerHTML = '';
      if (boardState[index]) {
        const piece = document.createElement('div');
        piece.classList.add('piece', boardState[index]);
        cell.appendChild(piece);
      }
    });

    let blackCount = 0;
    let whiteCount = 0;

    boardState.forEach((piece) => {
      if (piece === 'black') blackCount++;
      if (piece === 'white') whiteCount++;
    });

    document.getElementById('black-count').textContent = `Preto: ${blackCount}`;
    document.getElementById(
      'white-count'
    ).textContent = `Branco: ${whiteCount}`;
  };

  const updateTurnIndicator = () => {
    document.getElementById('player-turn').textContent = `Vez do jogador: ${
      currentPlayer === 'black' ? 'Preto' : 'Branco'
    }`;
  };

  document.getElementById('resign-button').addEventListener('click', () => {
    const message = `${
      clientColor === 'black' ? 'Branco' : 'Preto'
    } vence por desistência!`;
    document.getElementById('message').textContent = message;

    console.log('Desistência:', message);
    socket.send(
      JSON.stringify({
        type: 'resign',
      })
    );
  });

  createBoard();
});
