const name = 'updatePlayer';

import Ajv from 'ajv';

const ajv = new Ajv({ removeAdditional: true });

const schema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    role: {
      type: ['string', 'number'],
    },
    dead: {
      type: 'boolean',
    },
    handUp: {
      type: 'boolean',
    },
    voteLocked: {
      type: 'boolean',
    },
    usedGhostVote: {
      type: 'boolean',
    },
    marked: {
      type: 'boolean',
    },
    traveler: {
      type: 'boolean',
    },
  },
  required: ['id'],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

function execute(ws, json, activeGames) {
  if (typeof json.gameId !== 'string' || typeof json.myId !== 'string') {
    return;
  }

  if(!json.player || typeof json.player !== 'object' || !json.player.id) {
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

  if(!validate(json.player)) {
    console.log('failed validation');
    console.log(validate.errors);
    return;
  }

  const playerIndex = game.players.findIndex(player => player.id === json.player.id) 

  if (playerIndex === -1)
    return;

  let send = true;

  const oldPlayer = game.players[playerIndex];

  // since we instance a new version of the object this SHOULD work

  game.players[playerIndex] = {
    ...oldPlayer,
    ...json.player,
  };

  if (json.reveal && game.players[playerIndex].traveler) {
    game.clients.forEach((socket) => {
      socket.send(JSON.stringify({
        type: 'updatePlayer',
        player: {
          id: json.player.id,
          role: game.players[playerIndex].role,
        }
      }));
    });
    return
  }

  // this is a check to see if any PUBLICLY KNOWN VALUES changed - less react rerenders on the client!
  if (
    oldPlayer.name === game.players[playerIndex].name 
    && oldPlayer.dead === game.players[playerIndex].dead
    && oldPlayer.handUp === game.players[playerIndex].handUp
    && oldPlayer.voteLocked === game.players[playerIndex].voteLocked
    && oldPlayer.usedGhostVote === game.players[playerIndex].usedGhostVote
    && oldPlayer.marked === game.players[playerIndex].marked
  ) {
    return;
  }
  
  // if changes happened tell all of the clients!

  const message = {
    type: 'updatePlayer',
    player: {
      id: json.player.id,
      name: game.players[playerIndex].name,
      dead: game.players[playerIndex].dead,
      handUp: game.players[playerIndex].handUp,
      voteLocked: game.players[playerIndex].voteLocked,
      usedGhostVote: game.players[playerIndex].usedGhostVote,
      marked: game.players[playerIndex].marked,
    }
  };

  game.clients.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

export {name, execute};