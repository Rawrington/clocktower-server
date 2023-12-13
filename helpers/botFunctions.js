import { canSeeVotes } from './gameFunctions.js';

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

    game.clients.forEach((ws, id) => {
      ws.send(JSON.stringify({
        type: 'updatePlayerList',
        players: game.players.map((player) => {
          return {
            id: player.id,
            name: player.name,
            dead: player.dead,
            handUp: (canSeeVotes(game.players, game.customSpecials) || id === game.storyteller || id === player.id) ? player.handUp : false,
            usedGhostVote: player.usedGhostVote,
            voteLocked: (canSeeVotes(game.players, game.customSpecials) || id === game.storyteller || id === player.id) ? player.voteLocked : false,
            marked: player.marked,
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