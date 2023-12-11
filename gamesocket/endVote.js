const name = 'endVote';

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  // all values are booleans so let endVote make phone calls, who gives a shit anymore.

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

  if (!(game.nomination.nominated && !isNaN(game.nomination.nominated.index))) {
    return;
  }

  if (game.voteTimer) {
    clearTimeout(game.voteTimer);
  }

  if ((!game.voteInProgress || game.nomination.over) && json.result) {
    const voters = game.players.filter(player => player.handUp).map(player => player.name);

    const nomPlayer = game.players[game.nomination.nominated.index];

    game.votingHistory.push({
      time: Date.now(),
      nominator: game.nomination.nominator.name,
      nominated: game.nomination.nominated.name,
      type: (nomPlayer && nomPlayer.traveler) ? 'Exile' : 'Execution',
      votes: voters.length,
      majority: Math.ceil(game.players.filter(player => !player.dead).length / 2),
      voters: voters,
    });
  }

  game.players.forEach(player => {
    player.handUp = false;
    player.voteLocked = false;
  });

  if (json.mark && !isNaN(game.nomination.nominated.index)) {
    game.players.forEach(player => {
      player.marked = false;
    });
    
    game.players[game.nomination.nominated.index].marked = true;
  }

  const blockPlayer = game.players[game.nomination.nominated.index];

  game.nomination.nomiator = {};
  game.nomination.nominated = {};
  game.nomination.hand = -1;
  game.voteInProgress = false;

  game.clients.forEach((socket) => {
    if ((!game.voteInProgress || game.nomination.over) && json.result) {
      socket.send(JSON.stringify({
        type: 'setVotingHistory',
        votingHistory: game.votingHistory,
      }));
    }

    socket.send(JSON.stringify({
      type: 'nominationOver',
      mark: json.mark ? (blockPlayer.id) : undefined,
    }));
  });
};

export {name, execute};