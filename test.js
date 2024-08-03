const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maaş')
    .setDescription('Maaşınızı alabilirsiniz. (Sadece 168 saatte bir)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const zaman = Date.now();
    const cooldownHours = 168;

    try {
      let userBalance = await Balance.findOne({ guildId: guildId, userId: userId });

      if (!userBalance) {
        userBalance = new Balance({ guildId: guildId, userId: userId, balance: 0 });
      }

      if (userBalance.lastSalary) {
        const lastSalaryTime = userBalance.lastSalary.getTime();
        const elapsedHours = Math.floor((zaman - lastSalaryTime) / (1000 * 60 * 60));

        if (elapsedHours < cooldownHours) {
          const remainingHours = cooldownHours - elapsedHours;
          await interaction.reply(`1 haftalık cooldown süresi içerisindesiniz. Bir sonraki ödülü almak için ${remainingHours} saat beklemelisiniz.`);
          return;
        }
      }

      // Günlük ödüldeki minimum ve maksimum değerlerdir, değiştirebilirsiniz
      const miktar = 15000;

      userBalance.balance += miktar;
      userBalance.lastSalary = new Date(zaman);

      await userBalance.save();

      const embed = new EmbedBuilder()
        .setTitle('Haftalık Maaş')
        .setColor(5763719)
        .setDescription(`${interaction.user.username}, maaşınız ${miktar} TL yatırıldı!`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error processing salary:', error);
      await interaction.reply('Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    }
  },
};
