const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Balance = require('../models/Balance');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maaş')
    .setDescription('Maaşınızı alabilirsiniz. (Sadece 1 haftada bir)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const currentTime = Date.now();
    const cooldownHours = 168;

    try {
      // Fetch user balance from the database
      let userBalance = await Balance.findOne({ guildId: guildId, userId: userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ guildId: guildId, userId: userId, balance: 0 });
      }

      // Check if the user has a last salary timestamp
      if (userBalance.lastSalary) {
        const lastSalaryTime = userBalance.lastSalary.getTime();
        const elapsedHours = Math.floor((currentTime - lastSalaryTime) / (1000 * 60 * 60));

        // If the cooldown period has not elapsed, inform the user
        if (elapsedHours < cooldownHours) {
          const remainingHours = cooldownHours - elapsedHours;
          await interaction.reply(`1 haftalık cooldown süresi içerisindesiniz. Bir sonraki ödülü almak için ${remainingHours} saat beklemelisiniz.`);
          return;
        }
      }

      // Define the salary amount
      const salaryAmount = 15000;

      // Update user balance and last salary timestamp
      userBalance.balance += salaryAmount;
      userBalance.lastSalary = new Date(currentTime);

      // Save the updated user balance back to the database
      await userBalance.save();

      // Create an embed message to inform the user
      const embed = new EmbedBuilder()
        .setTitle('Haftalık Maaş')
        .setColor(5763719)
        .setDescription(`${interaction.user.username}, maaşınız ${salaryAmount} TL yatırıldı!`);

      // Reply to the user with the embed message
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error processing salary:', error);
      await interaction.reply('Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    }
  },
};
