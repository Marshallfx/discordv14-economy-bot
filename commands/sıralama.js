const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sıralama')
    .setDescription('En fazla parası olan ilk 10 kullanıcıyı gösterir.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    try {
      // MongoDB'den kullanıcı verilerini al
      const users = await Balance.find({ guildId: guildId }).sort({ balance: -1 }).limit(10).exec();

      if (users.length > 0) {
        const embed = new EmbedBuilder()
          .setTitle('En Fazla Bakiyesi Olan İlk 10 Kullanıcı')
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter({ text: 'Sıralama' });

        users.forEach((user, index) => {
          embed.addFields({ name: `${index + 1}. Sıra`, value: `<@${user.userId}> - ${user.balance} TL`, inline: true });
        });

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply('Herhangi bir kullanıcı bulunamadı.');
      }
    } catch (error) {
      console.error('Veritabanından veri alırken bir hata oluştu:', error);
      await interaction.reply('Veritabanından veri alırken bir hata oluştu.');
    }
  },
};
