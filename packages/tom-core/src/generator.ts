import { RegisteredPlayer, TournamentConfig } from './types.js';

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function formatDateForXml(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatBirthDate(birthYear?: string): string {
  if (!birthYear) return '02/27/2000';
  const clean = birthYear.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  }
  if (clean.includes('/')) {
    return clean;
  }
  return `02/27/${clean}`;
}

export function generateTdfXml(config: TournamentConfig, players: RegisteredPlayer[]): string {
  const now = new Date();
  const formattedNow = formatDateForXml(now);
  const startDate = config.startDate || formattedNow.split(' ')[0];

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

  const tournamentData = `
<tournament type="2" stage="1" version="1.80" gametype="TRADING_CARD_GAME" mode="LEAGUECHALLENGE">
\t<data>
\t\t<name>${escapeXml(config.tournamentName || 'Pokemon Tournament')}</name>
\t\t<id></id>
\t\t<city>${escapeXml(config.city || 'Local Store')}</city>
\t\t<state></state>
\t\t<country>${escapeXml(config.country || 'Brazil')}</country>
\t\t<roundtime>30</roundtime>
\t\t<finalsroundtime>75</finalsroundtime>
\t\t<organizer popid="${escapeXml(config.organizerPopId)}" name="${escapeXml(config.organizerName)}"/>
\t\t<startdate>${startDate}</startdate>
\t\t<lessswiss>false</lessswiss>
\t\t<autotablenumber>true</autotablenumber>
\t\t<overflowtablestart>0</overflowtablestart>
\t</data>
\t<timeelapsed>0</timeelapsed>
\t<players>`;

  const playersXml = players.map(player => {
    const { firstName, lastName } = splitName(player.fullName);
    const birthDate = formatBirthDate(player.birthYear);

    return `\t\t<player userid="${escapeXml(player.playerId)}">
\t\t\t<firstname>${escapeXml(firstName)}</firstname>
\t\t\t<lastname>${escapeXml(lastName)}</lastname>
\t\t\t<birthdate>${birthDate}</birthdate>
\t\t\t<starter>true</starter>
\t\t\t<creationdate>${formattedNow}</creationdate>
\t\t\t<lastmodifieddate>${formattedNow}</lastmodifieddate>
\t\t</player>`;
  }).join('\n');

  const xmlFooter = `
\t</players>
\t<pods>
\t</pods>
\t<finalsoptions>
\t</finalsoptions>
</tournament>`;

  return `${xmlHeader}${tournamentData}\n${playersXml}${xmlFooter}\n`;
}
