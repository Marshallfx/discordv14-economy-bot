function hasHigherRole(member, bot) {
    const botHighestRole = bot.roles.highest;
    const memberHighestRole = member.roles.highest;
    return memberHighestRole.comparePositionTo(botHighestRole) >= 0;
  }
  