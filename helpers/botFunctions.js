export function invitePlayer(client, auth, user, member, game, guildId, guildName) {
  const url = 'https://zachevil.online/?token=' + auth;

  client.gameAuthTokens.set(auth, {
    id: user.id,
    game: guildId,
  });

  if (!game.players.some(player => player.id === user.id) && user.id !== game.storyteller && member) {
    const newPlayer = {
      id: user.id,
      name: member.displayName,
      role: -1,
      member: member,
    };

    game.players.push(newPlayer);

    game.clients.forEach((ws) => {
      ws.send(JSON.stringify({
        type: 'updatePlayerList',
        players: game.players.map((player) => {
          return {
            id: player.id,
            name: player.name,
            dead: player.dead,
            handUp: player.handUp,
            usedGhostVote: player.usedGhostVote,
            voteLocked: player.voteLocked,
            marked: player.marked,
            role: player.id === user.id && -1,
          }
        }),
      }));
    });

    member.send({
      content: `You are invited to play Blood on the Clocktower in "${guildName}".\r\nYour invite link is ${url}`
    });
  }
  else {
    member.send({
      content: `You are playing Blood on the Clocktower in "${guildName}".\r\nYour invite link is ${url}`
    });
  }
}