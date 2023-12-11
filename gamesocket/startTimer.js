const name = 'startTimer';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  if (isNaN(json.minutes) || isNaN(json.seconds)) {
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

  if (game.currentGameTimer) {
    clearTimeout(game.currentGameTimer);
  }

  if (game.currentGameTimerWarning) {
    clearTimeout(game.currentGameTimerWarning);
  }

  game.pausedTimer = false;

  const timer = Number(json.minutes) * 60000 + Number(json.seconds) * 1000;

  game.timer = Date.now() + timer;

  game.currentGameTimer = setTimeout(() => {
    if (game.clients) {
      game.clients.forEach((socket) => {
        socket.send(JSON.stringify({
          type: 'timerEnd',
        }));
      });
    }
  }, timer);

  if (timer > 10000) {
    game.currentGameTimerWarning = setTimeout(() => {
      if (game.clients) {
        game.clients.forEach((socket) => {
          socket.send(JSON.stringify({
            type: 'storytellerAlert',
            alert: 'The timer is ending in 10 seconds!',
          }));
        });
      }
    }, timer - 10000);
  }

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify({
      type: 'setTimer',
      timer: game.timer + (socket.connectionTime * 1000),
    }));
  });
};

export {name, execute};