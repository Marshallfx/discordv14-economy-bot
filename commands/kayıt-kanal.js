const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kayıtkanal')
        .setDescription('Kayıt kanalı ayarlar.')
        .addChannelOption(option => option.setName('kanal').setDescription('Kayıt kanalı').setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('kanal');
        const settingsPath = path.join(__dirname, '..', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

        if (!settings.guilds) {
            settings.guilds = {};
        }

        if (!settings.guilds[interaction.guild.id]) {
            settings.guilds[interaction.guild.id] = {};
        }

        settings.guilds[interaction.guild.id].registerChannel = channel.id;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

        await interaction.reply(`Kayıt kanalı ${channel} olarak ayarlandı.`);
    },
};
