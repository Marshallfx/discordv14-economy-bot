const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullanıcıyı sunucudan atar.')
        .addUserOption(option => option.setName('hedef').setDescription('Atılacak kullanıcı').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('hedef');
        const member = interaction.guild.members.cache.get(target.id);

        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        if (!member) {
            return interaction.reply({ content: 'Bu kullanıcı bulunamadı.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Kullanıcı Atma')
            .setDescription(`${target.tag} adlı kullanıcıyı atmak istediğinize emin misiniz?`)
            .setThumbnail(target.displayAvatarURL())
            .setColor(0xFFA500);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('kick_onayla')
                    .setLabel('Onayla')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('kick_iptal')
                    .setLabel('İptal')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'kick_onayla') {
                try {
                    await member.kick();
                    await i.update({ content: `${target.tag} adlı kullanıcı sunucudan atıldı.`, embeds: [], components: [] });

                    const logPath = path.join(__dirname, '..', 'data', 'moderation.json');
                    let logs = [];
                    if (fs.existsSync(logPath)) {
                        logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                    }
                    logs.push({ type: 'kick', user: target.tag, date: new Date() });
                    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
                } catch (error) {
                    console.error(error);
                    await i.update({ content: 'Kullanıcıyı atarken bir hata oluştu.', embeds: [], components: [] });
                }
            } else if (i.customId === 'kick_iptal') {
                await i.update({ content: 'Atma işlemi iptal edildi.', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Atma işlemi zaman aşımına uğradı.', embeds: [], components: [] });
            }
        });
    },
};
