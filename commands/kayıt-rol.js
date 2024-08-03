const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

function hasHigherRole(memberRole, botRole) {
  return memberRole.position >= botRole.position;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayıtrol')
    .setDescription('Kayıt rolü ayarlar.')
    .addRoleOption(option => option.setName('rol').setDescription('Kayıt rolü').setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);

    if (!botMember || !botMember.roles.highest) {
      return interaction.reply({ content: 'Botun rol bilgilerine erişilemedi.', ephemeral: true });
    }

    if (hasHigherRole(role, botMember.roles.highest)) {
      return interaction.reply({ content: 'Bu rolü ayarlayamazsınız çünkü botun rolü bu rolden daha yukarıda olmalı.', ephemeral: true });
    }

    const settingsPath = path.join(__dirname, '..', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    if (!settings.guilds) {
      settings.guilds = {};
    }

    if (!settings.guilds[interaction.guild.id]) {
      settings.guilds[interaction.guild.id] = {};
    }

    settings.guilds[interaction.guild.id].registerRole = role.id;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    await interaction.reply(`Kayıt rolü ${role} olarak ayarlandı.`);
  },
};
