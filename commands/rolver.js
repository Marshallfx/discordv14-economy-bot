const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolver')
        .setDescription('Bir kullanıcıya rol verir.')
        .addUserOption(option => option.setName('hedef').setDescription('Rol verilecek kullanıcı').setRequired(true))
        .addRoleOption(option => option.setName('rol').setDescription('Verilecek rol').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply(); // Interaction'ı ertele

        const admin = interaction.user;
        const target = interaction.options.getUser('hedef');
        const role = interaction.options.getRole('rol');
        const member = await interaction.guild.members.fetch(target.id);

        // Check if the user has the Manage Roles permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.editReply('Bu komutu kullanma izniniz yok.');
        }

        if (member) {
            await member.roles.add(role);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Rol Verildi')
                .setDescription(`${target} kullanıcısına ${role.name} rolü verildi.`)
                .setThumbnail(target.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });


            // Send log message to log channel
            const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Rol Verildi')
                    .setDescription(`${interaction.user} tarafından ${target} kullanıcısına ${role.name} rolü verildi.`)
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        } else {
            await interaction.editReply('Kullanıcı bulunamadı.');
        }
    },
};
