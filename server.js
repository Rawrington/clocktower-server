import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import config from './config.json' assert { type: 'json' };
import sqlite3 from 'sqlite3';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';
import https from 'https';

import { canSeeVotes, cleanUpShowGrim } from './helpers/gameFunctions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Open the database, mostly for the bot, the game is all stored in variables!
const db = new sqlite3.Database('./bot-storage.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Opened the bot database.');
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS bot_guilds (guild TEXT PRIMARY KEY, night_category TEXT, town_square TEXT)');
});

process.on('exit', () => {
  console.log('Closing the database.');
  db.close();
});

process.on('SIGTERM', () => {
  console.log('Closing the database.');
  db.close();
});

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection();

/*const exampleGame = {
  players: [], //the same as the clients
  nomination: 
  edition: 'tb',
  clients: Map //array map of websockets for the clients
}*/

client.gameAuthTokens = new Map();

// we just use a regular JS Map for the active games!
client.activeGames = new Map(); 

const socketMessages = new Map();

const messagesPath = path.join(__dirname, 'gamesocket');
const messagesFiles = fs.readdirSync(messagesPath).filter(file => file.endsWith('.js'));

for (const file of messagesFiles) {
  const filePath = './gamesocket/' + file;
  const {name, execute} = await import(filePath);

  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if (name && execute) {
      socketMessages.set(name, { name, execute });
  } else {
    console.log(`[WARNING] The socket message handler at ${filePath} is missing a required "name" or "execute" property.`);
  }
}

// SERVER HANDLING CODE!
const sslOn = config.cert && config.key && config.ssl;

const options = {}

if (sslOn) {
  options.cert = fs.readFileSync(config.cert);
  options.key = fs.readFileSync(config.key);
  console.log(options);
  console.log("SSL ON");
}

const server = https.createServer(options);

const wss = new WebSocket.Server({
  ...(sslOn ? { server } : { port: 8080 }),
  verifyClient: info =>
    info.origin &&
    !!info.origin.match(
      /^https?:\/\/zachevil\.online/i
    )
  });

wss.on('connection', (ws) => {
  // time out authentication after 30 seconds.
  const timeout = setTimeout(() => {
    ws.close();
  }, 30000);

  ws.connectionTime = Date.now();

  ws.authenticated = false;

  ws.isAlive = true;
  ws.deadCounter = 0;

  ws.on("pong", () => {
    ws.isAlive = true;
    ws.deadCounter = 0;
  });

  ws.on('message', (message) => {
    if(message.toString() === 'ping') {
      ws.send('pong');
    }
    else
    {
      let json = {};

      try {
        json = JSON.parse(message);
      }
      catch {
        return;
      }

      if (typeof json !== 'object')
      {
        return;
      }

      if(!json.type) {
        return;
      }

      const handler = socketMessages.get(json.type);

      if(handler && handler.execute) {
        handler.execute(ws, json, client.activeGames, client.gameAuthTokens, timeout, client);
      }
    }
  });

  ws.on('close', () => {
    client.activeGames.forEach((game) => {
      game.clients.delete(ws);
    });
  });
});

const gameManager = setInterval(() => {
  client.activeGames.forEach((game, index) => {
    if ((Date.now() - game.createdAt) > 300000) {
      if (game.clients.size > 0) {
        return;
      }

      if (game.currentGameTimer) {
        clearTimeout(game.currentGameTimer);
      }

      if (game.currentGameTimerWarning) {
        clearTimeout(game.currentGameTimerWarning);
      }
      
      client.gameAuthTokens.forEach((auth, i) => {
        if (auth.game === index) {
          client.gameAuthTokens.delete(i);
        }
      });

      client.activeGames.delete(index);
    }
  });
}, 300000);
// every 5 minutes

const gameSync = setInterval(() => {
  client.activeGames.forEach((game, index) => {

    game.clients.forEach((sock, sockIndex) => {
      if (!sock || sock.readyState !== WebSocket.OPEN) {
        game.clients.delete(sockIndex);
        return;
      }

      const message = {
        type: 'syncGameState',
        players: game.players.map((player) => {
            const playerObj = {
              id: player.id,
              name: player.name,
              dead: player.dead,
              handUp: (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || sockIndex === game.storyteller || sockIndex === player.id) ? player.handUp : false,
              voteLocked: (canSeeVotes(game.players, game.customSpecials, game.forceHidden) || sockIndex === game.storyteller || sockIndex === player.id) ?  player.voteLocked : false,
              usedGhostVote: player.usedGhostVote,
              marked: player.marked,
              firstNight: sockIndex === game.storyteller ? player.firstNight : false,
            };

            return playerObj;
          }),
        edition: game.edition,
        nomination: game.nomination,
        timer: typeof game.timer === 'string' ? game.timer : (game.timer + (sock.connectionTime * 1000)),
        night: game.night,
        fabled: game.fabled,
        votingHistory: game.votingHistory,
        gameId: index,
        dayNumber: game.daytracker,
      }

      sock.send(JSON.stringify(message));
    });
  });
}, 20000);

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false && ws.deadCounter > 2) {
      client.activeGames.forEach((game) => {
        game.clients.forEach((sock, sockIndex) => {
          if (sock === ws) {
            game.clients.delete(sockIndex);
          }
        });
      });
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.deadCounter = ws.deadCounter + 1;
    ws.ping(() => {});
  });
}, 30000);

// handle server shutdown
wss.on("close", () => {
  clearInterval(interval);
  clearInterval(gameManager);
  clearInterval(gameSync);
});

if (sslOn) {
  server.listen(config.port);
}
 
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = './commands/' + folder + '/' + file;
    const { data, execute } = await import(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if (data && execute) {
      client.commands.set(data.name, { data, execute });
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, db);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const state = newState || oldState;

  if (!state || !state.channel || !state.channelId || !state.id) return;

  const currentGame = client.activeGames.get(state.guild && state.guild.id);

  if (!currentGame) return;

  const members = newState.channel.members.map(member => member.id);

  const oldMembers = oldState && oldState.channel && oldState.channel.members.map(member => member.id);

  const st = currentGame.clients.get(currentGame.storyteller);

  if (members.includes(currentGame.storyteller)) {
    if(st && st.send) {
      st.send(JSON.stringify({
        type: 'updateVoice',
        members: members.filter(member => member !== currentGame.storyteller),
      }));
    }

    cleanUpShowGrim(oldMembers ? oldMembers : [], currentGame, st);
  }
  else if (oldMembers && oldMembers.includes(currentGame.storyteller)) {
    if(st && st.send) {
      st.send(JSON.stringify({
        type: 'updateVoice',
        members: oldMembers.filter(member => member !== currentGame.storyteller),
      }));
    }

    cleanUpShowGrim(members, currentGame, st);
  }
  else if (oldState && oldMembers && oldState.id === currentGame.storyteller && !newState) {
    if(st && st.send) {
      st.send(JSON.stringify({
        type: 'updateVoice',
        members: [],
      }));
    }

    cleanUpShowGrim(oldMembers, currentGame, st);
  }
});

// Log in to Discord with your client's token
client.login(config.token);