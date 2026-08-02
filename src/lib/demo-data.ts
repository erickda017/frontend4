export type PlatformId = "spotify" | "youtube" | "apple" | "deezer" | "tidal";

export type Platform = {
  id: PlatformId;
  name: string;
  color: string;
  connected: boolean;
  minutes: number;
  plays: number;
  share: number;
};

export const platforms: Platform[] = [
  {
    id: "spotify",
    name: "Spotify",
    color: "var(--chart-1)",
    connected: true,
    minutes: 41250,
    plays: 12840,
    share: 46,
  },
  {
    id: "youtube",
    name: "YouTube Music",
    color: "var(--chart-2)",
    connected: true,
    minutes: 21980,
    plays: 6120,
    share: 24,
  },
  {
    id: "apple",
    name: "Apple Music",
    color: "var(--chart-3)",
    connected: true,
    minutes: 13400,
    plays: 3980,
    share: 15,
  },
  {
    id: "deezer",
    name: "Deezer",
    color: "var(--chart-4)",
    connected: false,
    minutes: 8900,
    plays: 2410,
    share: 10,
  },
  {
    id: "tidal",
    name: "Tidal",
    color: "var(--chart-5)",
    connected: false,
    minutes: 4300,
    plays: 1120,
    share: 5,
  },
];

export const monthlyMinutes = [
  { mes: "Jan", spotify: 3100, youtube: 1500, apple: 900, deezer: 600 },
  { mes: "Fev", spotify: 2800, youtube: 1700, apple: 1100, deezer: 700 },
  { mes: "Mar", spotify: 3600, youtube: 1900, apple: 1000, deezer: 820 },
  { mes: "Abr", spotify: 3300, youtube: 2100, apple: 1250, deezer: 640 },
  { mes: "Mai", spotify: 4100, youtube: 1800, apple: 1400, deezer: 900 },
  { mes: "Jun", spotify: 3900, youtube: 2300, apple: 1150, deezer: 780 },
  { mes: "Jul", spotify: 4400, youtube: 2500, apple: 1600, deezer: 1010 },
  { mes: "Ago", spotify: 4700, youtube: 2200, apple: 1500, deezer: 950 },
];

export const listeningByHour = [
  { hora: "00h", min: 120 },
  { hora: "03h", min: 40 },
  { hora: "06h", min: 90 },
  { hora: "09h", min: 380 },
  { hora: "12h", min: 460 },
  { hora: "15h", min: 520 },
  { hora: "18h", min: 610 },
  { hora: "21h", min: 430 },
];

export const genreSplit = [
  { genero: "Indie Rock", valor: 28 },
  { genero: "MPB", valor: 22 },
  { genero: "Eletrônica", valor: 18 },
  { genero: "Hip Hop", valor: 17 },
  { genero: "Jazz", valor: 15 },
];

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  platform: PlatformId;
  playedAt: string;
  durationSec: number;
};

export const history: Track[] = [
  {
    id: "1",
    title: "Aurora Tardia",
    artist: "Marina Sol",
    album: "Ciclos",
    platform: "spotify",
    playedAt: "Hoje, 14:32",
    durationSec: 214,
  },
  {
    id: "2",
    title: "Neon Interlude",
    artist: "Casa Vazia",
    album: "Ruído Bonito",
    platform: "youtube",
    playedAt: "Hoje, 14:26",
    durationSec: 188,
  },
  {
    id: "3",
    title: "Ponte Velha",
    artist: "Trio Norte",
    album: "Travessia",
    platform: "apple",
    playedAt: "Hoje, 13:58",
    durationSec: 302,
  },
  {
    id: "4",
    title: "Chuva de Verão",
    artist: "Lia Prado",
    album: "Interior",
    platform: "spotify",
    playedAt: "Hoje, 13:41",
    durationSec: 245,
  },
  {
    id: "5",
    title: "Modo Avião",
    artist: "Rafa Mota",
    album: "Turbulência",
    platform: "deezer",
    playedAt: "Ontem, 22:10",
    durationSec: 199,
  },
  {
    id: "6",
    title: "Bossa Elétrica",
    artist: "Duo Maré",
    album: "Alta Costura",
    platform: "youtube",
    playedAt: "Ontem, 21:44",
    durationSec: 268,
  },
  {
    id: "7",
    title: "Cidade Baixa",
    artist: "Marina Sol",
    album: "Ciclos",
    platform: "spotify",
    playedAt: "Ontem, 20:02",
    durationSec: 231,
  },
  {
    id: "8",
    title: "Fio de Prata",
    artist: "Nuvem 9",
    album: "Estática",
    platform: "tidal",
    playedAt: "Ontem, 18:37",
    durationSec: 176,
  },
];

export const topArtists = [
  { nome: "Marina Sol", minutos: 1840, plataforma: "Spotify" },
  { nome: "Casa Vazia", minutos: 1420, plataforma: "YouTube Music" },
  { nome: "Trio Norte", minutos: 1180, plataforma: "Apple Music" },
  { nome: "Lia Prado", minutos: 960, plataforma: "Spotify" },
  { nome: "Nuvem 9", minutos: 720, plataforma: "Tidal" },
];

export type Goal = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
};

export const goals: Goal[] = [
  {
    id: "g1",
    title: "1.000 minutos no mês",
    description: "Tempo total de audição somando todas as plataformas.",
    current: 742,
    target: 1000,
    unit: "min",
  },
  {
    id: "g2",
    title: "30 artistas novos",
    description: "Descobrir artistas que você nunca ouviu antes.",
    current: 19,
    target: 30,
    unit: "artistas",
  },
  {
    id: "g3",
    title: "5 gêneros diferentes por semana",
    description: "Manter a diversidade musical em alta.",
    current: 4,
    target: 5,
    unit: "gêneros",
  },
  {
    id: "g4",
    title: "12 álbuns completos",
    description: "Ouvir álbuns do começo ao fim, sem pular faixas.",
    current: 8,
    target: 12,
    unit: "álbuns",
  },
];

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  rarity: "Comum" | "Rara" | "Épica" | "Lendária";
};

export const achievements: Achievement[] = [
  {
    id: "a1",
    title: "Maratonista",
    description: "8 horas de música em um único dia.",
    unlocked: true,
    rarity: "Rara",
  },
  {
    id: "a2",
    title: "Poliglota Sonoro",
    description: "Ouviu músicas em 5 idiomas diferentes.",
    unlocked: true,
    rarity: "Épica",
  },
  {
    id: "a3",
    title: "Multiplataforma",
    description: "Conectou 3 serviços de streaming.",
    unlocked: true,
    rarity: "Comum",
  },
  {
    id: "a4",
    title: "Coruja",
    description: "50 faixas ouvidas entre 2h e 5h da manhã.",
    unlocked: false,
    rarity: "Rara",
  },
  {
    id: "a5",
    title: "Arqueólogo",
    description: "100 músicas lançadas antes de 1980.",
    unlocked: false,
    rarity: "Épica",
  },
  {
    id: "a6",
    title: "Ano Redondo",
    description: "365 dias seguidos com pelo menos uma faixa registrada.",
    unlocked: false,
    rarity: "Lendária",
  },
];

export const platformById = Object.fromEntries(platforms.map((p) => [p.id, p])) as Record<
  PlatformId,
  Platform
>;

export const totals = {
  minutes: platforms.reduce((acc, p) => acc + p.minutes, 0),
  plays: platforms.reduce((acc, p) => acc + p.plays, 0),
  artists: 1284,
  streak: 46,
};
