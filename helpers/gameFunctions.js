import standardRoles from './roles.json' assert { type: 'json' };
import fabled from './fabled.json' assert { type: 'json' };
import specials from './specials.json' assert { type: 'json' };
import { PermissionsBitField } from 'discord.js';

// this is taken from Moveer and edited, it just prevents unneccesaary errors and tells us what went wrong.
function canMove(guild, member, channel) {
  if (guild.members.me == null) {
    console.error('HOW COULD THIS HAPPEN DINESH?');
    return false;
  }

  const userVoiceChannel = guild.voiceStates.cache
    .filter((user) => user.id === member.id)
    .first().channel;

  if (userVoiceChannel == null) {
    console.log(`User ${member.id} is not connected to voice`);
    return false;
  }

  // Validate that we have access to the fromVoiceChannel
  const permissions = userVoiceChannel.permissionsFor(
    guild.members.me,
  );

  if (!permissions.has(PermissionsBitField.Flags.MoveMembers)) {
    console.log(`Could not move ${member} - Splatter is missing MOVE permissions to - ${userVoiceChannel}`);
    return false;
  }

  if (!permissions.has(PermissionsBitField.Flags.Connect)) {
    console.log(`Could not move ${member}. Splatter is missing CONNECT permissions to - ${userVoiceChannel}`);
    return false;
  }

  // Validate that we have access to the toVoiceChannel
  const botPerms = channel.permissionsFor(
    guild.members.me,
  );

  const userPerms = channel.permissionsFor(member);

  if (!userPerms.has(PermissionsBitField.Flags.ViewChannel) && !botPerms.has(PermissionsBitField.Flags.ViewChannel)) {
    console.log(`Could not move ${member}. Splatter is missing VIEW CHANNEL permissions to - ${channel}`);
    return false;
  }

  return true;
}

export async function moveToNightChannels(client, game) {
  if (game.players.length <= 0) {
    return 'Not enough players!';
  }

  const guild = await client.guilds.fetch(game.id);

  const playerList = game.players.map(player => player.member).filter(member => member && member.voice);

  if(playerList.length <= 0) {
    return;
  }
  
  const nightCategory = await guild.channels.fetch(game.nightCategory);

  const nightChannels = nightCategory.children.cache.filter((channel) => channel.permissionsFor(playerList[0]).has(PermissionsBitField.Flags.Connect)).sort((a, b) => {
    return a.rawPosition - b.rawPosition;
  });

  if (nightChannels.size < playerList.length) {
    return 'Not enough channels for ' + playerList.length + 'players';
  }

  const channelIterator = nightChannels.entries();

  playerList.forEach((member) => {
    if(member && member.voice) {
      try {
        const channel = channelIterator.next().value[1];
        if(canMove(guild, member, channel)) {
          member.voice.setChannel(channel);
        }
      } catch (error) {
        console.error(error)
      }
    }
  });

  const st = game.storytellerMember;

  if(st && st.voice) {
    const stChannels = nightCategory.children.cache.filter((channel) => !channel.permissionsFor(playerList[0]).has(PermissionsBitField.Flags.Connect));

    if(stChannels.size > 0) {
      try {
        const channel = stChannels.entries().next().value[1];
        if(canMove(guild, st, channel)) {
          st.voice.setChannel(channel);
        }
      } catch (error) {
        console.error(error)
      }
    }
  }
}

export async function moveToDayChannel(client, game) {
  const guild = await client.guilds.fetch(game.id);

  const playerList = game.players.map(player => player.member).filter(member => member && member.voice);

  if(playerList.length <= 0) {
    return;
  }

  const dayChannel = guild.channels.cache.get(game.townSquare);

  playerList.forEach((member) => {
    if(member && member.voice) {
      try {
        if(canMove(guild, member, dayChannel)) {
          member.voice.setChannel(dayChannel);
        }
      } catch (error) {
        console.error(error)
      }
    }
  });

  const st = game.storytellerMember;

  if(st && st.voice) {
    try {
      if(canMove(guild, st, dayChannel)) {
        st.voice.setChannel(dayChannel);
      }
    } catch (error) {
      console.error(error)
    }
  }
}

export async function moveStToPlayer(client, game, st, member) {
  const guild = await client.guilds.fetch(game.id);

  if(st && st.voice && member && member.voice && member.voice.channel) {
    try {
      if(canMove(guild, st, member.voice.channel)) {
        st.voice.setChannel(member.voice.channel);
      }
    } catch (error) {
      console.error(error)
    }
  }
}

export function getSpecial(customSpecials, role, type, name) {
  return specials.find(special => special.role === role && special.type === type && special.name === name) || customSpecials.find(special => special.role === role && special.type === type && special.name === name);
}

export function canSeeVotes(players, customSpecials, forceHidden) {
  return forceHidden ? (forceHidden === 'forcedisable' && true) : (!players.some(player => !player.dead && getSpecial(customSpecials, player.role, 'vote', 'hidden')));
}

export function cleanUpShowGrim(members, game, st) {
  members.forEach(member => {
    const player = game.players.find(player => player.id == member);

    if (player && player.hasGrim) {
      player.hasGrim = false;

      const pSock = game.clients.get(member);

      if (pSock && pSock.send) {
        pSock.send(JSON.stringify({
          type: 'storytellerGrim',
          players: false,
          notes: false,
        }));
      }

      if (st && st.send) {
        st.send(JSON.stringify({
          type: 'updatePlayer',
          player: {
            id: player.id,
            hasGrim: false,
          },
        }));
      }
    }
  });
}

export function getRole(role, edition) {
  return standardRoles.find(r => r.id === role) || (typeof edition === 'object' && edition.find(r => typeof r === 'object' && r.id === role));
}

export function getFabled(role) {
  return fabled.find(r => r.id === role);
}

export function assignRoles(game, roles) {
  // shuffle the roles!
  const shuffled = roles.toSorted(() => 0.5 - Math.random());

  // not used atm because we cant assign travellers BUT! will be used probably.
  const currentPlayers = game.players.filter((player) => (!getRole(player.role, game.edition) || getRole(player.role, game.edition).team !== 'traveler')); 

  if(roles.length !== currentPlayers.length) {
    return false;
  }
  
  currentPlayers.forEach((player, i) => {
    // HAND THOSE ROLES OUT LIKE CANDY!
    currentPlayers[i].role = shuffled[i];
    currentPlayers[i].traveler = false;
    currentPlayers[i].firstNight = true;
  });

  return true;
};

export function sendOutRoles(game, sendToAll) {
  if (sendToAll) {
    game.players.forEach((player) => {
      player.lastKnownRole = player.role;

      const client = game.clients.get(player.id);

      // if this happens wtf!
      if (!client || !client.send) {
        return;
      }

      player.seenRole = player.role;

      client.send(JSON.stringify({
        type: 'updatePlayer',
        player: {
          id: player.id,
          role: player.role,
        }
      }));
    });
  }

  const st = game.clients.get(game.storyteller);

  // made sure we DONT send the info on a discord client to someone by mistake

  if(st && st.send) {
    st.send(JSON.stringify({
      type: 'updatePlayerList',
      players: game.players.map(player => {
        return {
          id: player.id,
          name: player.name,
          dead: player.dead,
          handUp: player.handUp,
          voteLocked: player.voteLocked,
          usedGhostVote: player.usedGhostVote,
          marked: player.marked,
          hasGrim: player.hasGrim,
          role: player.role,
          firstNight: player.firstNight,
        };
      }),
    }));
  }
}

function checkPlayer(player, game, initialHand, length, visibleVote) {
  if (game.nomination.hand  !== initialHand) {
    const client = game.clients.get(player.id);

    if(client && client.send) {
      client.send(JSON.stringify({
        type: 'requestFinalVote',
      }));
    }

    player.lockedAt = Date.now();

    game.nomination.votes = game.nomination.voters.length;

    // falsey value? 0 it out
    if (!player.handUp) {
      player.handUp = 0;
    }

    //2 or truthy value (1)
    // eventually this will be a for loop i think im just keeping it like this so i remember

    if (player.handUp) {
      game.nomination.voters.push(player.id);
      if (player.handUp === 2) {
        game.nomination.voters.push(player.id);
      }
    }

    player.voteLocked = game.nomination.votes + player.handUp;

    const handMod = game.nomination.hand % length;

    // we want to make sure no other messages intefered somehow
    game.players[handMod] = player;
  }

  if ((game.nomination.hand % length !== initialHand) || initialHand === game.nomination.hand) {
    game.nomination.hand = game.nomination.hand + 1;
  }

  game.clients.forEach((socket, id) => {
    if (game.nomination.hand  !== initialHand) {
      socket.send(JSON.stringify({
        type: 'updatePlayer',
        player: {
          id: player.id,
          handUp: (visibleVote || id === game.storyteller || id === player.id) ? player.handUp : false,
          voteLocked: (visibleVote || id === game.storyteller || id === player.id) ? player.voteLocked : false,
        }
      }));
    }

    socket.send(JSON.stringify({
      type: 'setHand',
      hand: game.nomination.hand,
      transition: game.nomination.transition,
    }));
  });

  if (!game.players[game.nomination.hand % length].voteLocked && game.players[game.nomination.hand % length].voteLocked !== 0) {
    game.voteTimer = setTimeout(() => {
      checkPlayer(game.players[game.nomination.hand % length], game, initialHand, length, visibleVote);
    }, game.nomination.transition * 1000);
  }
  else {
    game.nomination.running = false;
    game.nomination.over = true;

    const st = game.clients.get(game.storyteller);

    if(st && st.send) {
      st.send(JSON.stringify({
        type: 'setNomination',
        nomination: {
          over: true,
          running: false,
        },
      }));
    }

    game.voteInProgress = false;
  }
}

export function runVote(game) {
  if(!game.players[game.nomination.hand]) {
    console.log('HOW DID WE GET HERE?');
    return;
  }

  game.nomination.running = true;

  const st = game.clients.get(game.storyteller);

  if(st && st.send) {
    st.send(JSON.stringify({
      type: 'setNomination',
      nomination: {
        running: true,
      },
    }));
  }

  checkPlayer(game.players[game.nomination.hand], game, game.nomination.hand, game.players.length, canSeeVotes(game.players, game.customSpecials, game.forceHidden))
}

export function runVoteCountdown(game) {
  game.clients.forEach((socket) => {
    socket.send(JSON.stringify({
      type: 'playCountdown',
    }));
  });

  const st = game.clients.get(game.storyteller);

  game.nomination.running = true;

  if(st && st.send) {
    st.send(JSON.stringify({
      type: 'setNomination',
      nomination: {
        running: true,
      },
    }));
  }

  game.voteTimer = setTimeout(() => {
    runVote(game);
  }, 3000);
}