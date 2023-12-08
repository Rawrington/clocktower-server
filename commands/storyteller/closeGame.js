import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { nanoid } from 'nanoid'

const data = new SlashCommandBuilder()
  .setName('closegame')
  .setDescription('Closes the currently active Clocktower game.')
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
  .setDMPermission(false);

async function execute(interaction, db) {
  const channel = interaction.options.getChannel('town-square');

  const game = interaction.client.activeGames.get(interaction.guildId);

  if(!game) {
    await interaction.reply({ content: 'There is no running game!', ephemeral: true });
  }
  else {
    if (game.currentGameTimer) {
      clearTimeout(game.currentGameTimer);
    }

    if (game.currentGameTimerWarning) {
      clearTimeout(game.currentGameTimerWarning);
    }

    if (game.voteTimer) {
      clearTimeout(game.voteTimer);
    }

    game.clients.forEach((sock) => {
      sock.close();
    });

    interaction.client.gameAuthTokens.forEach((auth, i) => {
      if (auth.game === interaction.guildId) {
        interaction.client.gameAuthTokens.delete(i);
      }
    });

    interaction.client.activeGames.delete(interaction.guildId);

    await interaction.reply({ content: `Ended the currently running Clocktower game.`, ephemeral: true });
  }
};

export { data, execute };