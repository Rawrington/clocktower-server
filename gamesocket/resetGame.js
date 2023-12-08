const name = 'resetGame';

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

  if(game.voteTimer) {
    clearTimeout(game.voteTimer);
  }

  if (game.currentGameTimer) {
    clearTimeout(game.currentGameTimer);
  }

  if (game.currentGameTimerWarning) {
    clearTimeout(game.currentGameTimerWarning);
  }

  game.votingHistory = [];
  game.timer = -1;
  game.pausedTimer = -1;

  game.players.forEach((player) => {
    player.dead = false;
    player.usedGhostVote = false;
    player.marked = false;
    player.voteLocked = false;
    player.handUp = false;
    player.role = -1;
  });

  game.nomination = {};
  game.voteInProgress = false;

  game.clients.forEach((ws) => {
    ws.send(JSON.stringify({
      type: 'syncGameState',
      players: game.players.map((player) => {
        return {
          id: player.id,
          name: player.name,
          dead: player.dead,
          handUp: player.handUp,
          usedGhostVote: player.usedGhostVote,
          voteLocked: player.voteLocked,
          marked: player.marked,
          role: player.role,
        }
      }),
      edition: game.edition,
      nomination: game.nomination,
      timer: game.timer + (ws.connectionTime * 1000),
      night: game.night,
      fabled: game.fabled,
      votingHistory: game.votingHistory,
      gameId: json.gameId,
    }));
  });
};

export {name, execute};