import { canSeeVotes } from './gameFunctions.js';

export function invitePlayer(client, auth, user, member, game, guildId, guildName) {
  const url = 'https://zachevil.online/?token=' + auth;

  client.gameAuthTokens.set(auth, {
    id: user.id,
    game: guildId,
  });

  if (!game.players.some(player => player.id === user.id) && user.id !== game.storyteller && member) {
    const pronouns = member.displayName.match(/[\[|\(]([^\/]+?)\/(.+?)[\]|\)]/);

    const filterName = member.displayName.replace(/[\[|\(]([^\/]+?)\/(.+?)[\]|\)]/, '');

    const newPlayer = {
      id: user.id,
      name: filterName,
      role: -1,
      member: member,
      pronouns: pronouns && (pronouns[1] + '/' + pronouns[2]),
      handUp: false,
      voteLocked: false,
      activeSpecials: [],
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
            handUp: (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || id === game.storyteller || id === player.id) ? player.handUp : false,
            usedGhostVote: player.usedGhostVote,
            voteLocked: (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || id === game.storyteller || id === player.id) ? player.voteLocked : false,
            marked: player.marked,
            pronouns: player.pronouns,
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