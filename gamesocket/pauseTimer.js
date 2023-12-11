const name = 'pauseTimer';

function execute(ws, json, activeGames) {
  // note: while ignoring these not being strings is acceptable behavior too (it wont error) we save computation time if the client tries to send garbage (or some bad actor does).
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

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

  game.pausedTimer = game.timer - Date.now();

  const diffy = game.pausedTimer / 1000;

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