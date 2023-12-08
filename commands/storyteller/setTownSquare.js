import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('settownsquare')
  .setDescription('Set the channel for the town square.')
  .addChannelOption(option => option
    .setName('town-square')
    .setDescription('The channel to be used as the Town Square')
    .addChannelTypes(ChannelType.GuildVoice)
    .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
  .setDMPermission(false);

async function execute(interaction, db) {
  const channel = interaction.options.getChannel('town-square');

  const stmt = db.prepare("INSERT INTO bot_guilds(guild, town_square) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET town_square=excluded.town_square");

  console.log(channel.id);

  stmt.run(interaction.guildId, channel.id);

  stmt.finalize();

  await interaction.reply(`Set Town Square to ${channel.name}.`);
};

export { data, execute };