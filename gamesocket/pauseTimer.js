const name = 'pauseTimer';

function execute(ws, json, activeGames) {
  const game = activeGames.get(json.gameId);

  if (!game) {
    return;
  }

  if(ws !== game.clients.get(json.myId)) {
    return;
  }

  if(json.myId != game.storyteller) {
    return;
  }

  if (!game.timer || typeof game.timer === 'string' || game.pausedTimer || game.timer < Date.now()) {
    return;
  }

  if (game.currentGameTimer) {
    clearTimeout(game.currentGameTimer);
  }

  if (game.currentGameTimerWarning) {
    clearTimeout(game.currentGameTimerWarning);
  }

  game.pausedTimer = game.timer + (ws.connectionTime * 1000);

  const diffy = (game.timer - Date.now()) / 1000;

  const minutes = Math.floor(diffy / 60);

  const seconds = Math.floor(diffy - (minutes * 60));

  game.timer = minutes + ':' + ('0' + seconds).slice(-2);

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify({
      type: 'setTimer',
      timer: game.timer,
    }));
  });
};

export {name, execute};