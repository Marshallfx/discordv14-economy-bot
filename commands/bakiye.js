const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bakiye')
        .setDescription('Paranızı gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Bakiyesini görmek istediğiniz kullanıcı')),

    async execute(interaction) {
        const user = interaction.options.getUser('kullanici') || interaction.user;
        const userId = user.id;
        const guildId = interaction.guild.id;

        try {
            const userBalance = await Balance.findOne({ guildId: guildId, userId: userId });
            const balance = userBalance ? userBalance.balance : 0;

            const embed = new EmbedBuilder()
                .setTitle(`${user.username} Kullanıcısının Bakiyesi`)
                .setColor(0x00AE86)
                .setDescription(`<@${user.id}> hesabında **${balance} TL** var.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching balance:', error);
            await interaction.reply('Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
        }
    },
};
