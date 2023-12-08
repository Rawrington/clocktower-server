import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('setnightcategory')
  .setDescription('Set the channel for the night category.')
  .addChannelOption(option => option
    .setName('night-category')
    .setDescription('The category of channels to use at night')
    .addChannelTypes(ChannelType.GuildCategory)
    .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
  .setDMPermission(false);

async function execute(interaction, db) {
  const category = interaction.options.getChannel('night-category');

  const stmt = db.prepare("INSERT INTO bot_guilds(guild, night_category) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET night_category=excluded.night_category");

  stmt.run(interaction.guildId, category.id);

  stmt.finalize();

  await interaction.reply(`Set Night Category to ${category.name}.`);
}

export { data, execute };