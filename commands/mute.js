const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Bir kullanıcıyı kalıcı olarak susturur.')
        .addUserOption(option => option.setName('hedef').setDescription('Susturulacak kullanıcı').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('hedef');
        const member = interaction.guild.members.cache.get(target.id);

        if (!interaction.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        if (!member) {
            return interaction.reply({ content: 'Bu kullanıcı bulunamadı.', ephemeral: true });
        }

        const mutedRole = interaction.guild.roles.cache.find(role => role.name === 'Susturulmuş');
        if (!mutedRole) {
            return interaction.reply('Susturulmuş rolü bulunamadı.');
        }

        const embed = new EmbedBuilder()
            .setTitle('Kullanıcı Susturma')
            .setDescription(`${target.tag} adlı kullanıcıyı kalıcı olarak susturmak istediğinize emin misiniz?`)
            .setThumbnail(target.displayAvatarURL())
            .setColor(0x808080);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mute_onayla')
                    .setLabel('Onayla')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('mute_iptal')
                    .setLabel('İptal')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'mute_onayla') {
                try {
                    await member.roles.add(mutedRole);
                    await i.update({ content: `${target.tag} adlı kullanıcı kalıcı olarak susturuldu.`, embeds: [], components: [] });

                    const logPath = path.join(__dirname, '..', 'data', 'moderation.json');
                    let logs = [];
                    if (fs.existsSync(logPath)) {
                        logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                    }
                    logs.push({ type: 'mute', user: target.tag, date: new Date() });
                    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
                } catch (error) {
                    console.error(error);
                    await i.update({ content: 'Kullanıcıyı sustururken bir hata oluştu.', embeds: [], components: [] });
                }
            } else if (i.customId === 'mute_iptal') {
                await i.update({ content: 'Susturma işlemi iptal edildi.', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Susturma işlemi zaman aşımına uğradı.', embeds: [], components: [] });
            }
        });
    },
};
