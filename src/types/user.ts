export type RabattTrinn = number | null;

export interface InternKortVerv {
  navn: string;
  gruppe: string;
  signertKontrakt: boolean;
  rabattTrinn: RabattTrinn;
}

export interface User {
  id: number;
  fornavn: string;
  etternavn: string;
  fodselsdato: Date | null;
  opprettet: Date | null;
  gyldigTil: Date;
  bildeUrl?: string;
  pingvinPoengSum: number;
  aktiveVerv: InternKortVerv[];
  dagensOrd: string;
}

const tierMapping: Record<string, number> = {
  null: 0,
  "1": 1,
  "0": 2,
  "2": 3,
  "3": 4,
};

function mapTier(rabattTrinn: RabattTrinn): number {
  const key = rabattTrinn === null ? "null" : String(rabattTrinn);
  return tierMapping[key] ?? 0;
}

function cloneVerv(verv: InternKortVerv): InternKortVerv {
  return {
    navn: verv.navn,
    gruppe: verv.gruppe,
    signertKontrakt: verv.signertKontrakt,
    rabattTrinn: verv.rabattTrinn,
  };
}

function getHighestTierVervInternal(user: User): InternKortVerv | null {
  const activeVerv = user.aktiveVerv.map(cloneVerv);

  let highest: InternKortVerv | null = null;
  for (const verv of activeVerv) {
    if (!highest || mapTier(verv.rabattTrinn) > mapTier(highest.rabattTrinn)) {
      highest = cloneVerv(verv);
    }
  }

  if (user.pingvinPoengSum >= 14) {
    if (activeVerv.length === 0) {
      highest = {
        navn: "Pingvin",
        gruppe: "Pingvin Ordenen",
        signertKontrakt: true,
        rabattTrinn: 3,
      };
    } else if (highest) {
      if ((highest.rabattTrinn ?? 0) < 3) {
        highest.rabattTrinn = 3;
      }

      if (!highest.navn.toLowerCase().includes("pingvin")) {
        highest.navn = `${highest.navn} (Pingvin)`;
      }
    }
  }

  return highest;
}

export function getHighestTier(user: User): number {
  if (user.aktiveVerv.length === 0 && user.pingvinPoengSum < 14) {
    return 0;
  }
  return getHighestTierVervInternal(user)?.rabattTrinn ?? 0;
}

export function getHighestTierGroup(user: User): string {
  if (user.aktiveVerv.length === 0 && user.pingvinPoengSum < 14) {
    return "";
  }
  return getHighestTierVervInternal(user)?.gruppe ?? "";
}

export function getHighestTierName(user: User): string {
  if (user.aktiveVerv.length === 0 && user.pingvinPoengSum < 14) {
    return "";
  }
  return getHighestTierVervInternal(user)?.navn ?? "";
}

export function createDemoUser(): User {
  return {
    id: 0,
    fornavn: "Bar",
    etternavn: "Pingvin",
    fodselsdato: new Date(2000, 0, 1),
    opprettet: new Date(),
    gyldigTil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    pingvinPoengSum: 42,
    aktiveVerv: [
      {
        navn: "Medlem",
        gruppe: "PR-Etaten",
        signertKontrakt: true,
        rabattTrinn: 2,
      },
    ],
    dagensOrd: "Dagens ord: eplepingvin",
    bildeUrl: "assets/images/demopingvin.png",
  };
}
