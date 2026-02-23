export type RabattTrinn = number | null

export interface InternKortVerv {
    navn: string
    gruppe: string
    signertKontrakt: boolean
    rabattTrinn: RabattTrinn
}

export interface User {
    id: number
    fornavn: string
    etternavn: string
    fodselsdato: Date | null
    opprettet: Date | null
    gyldigTil: Date
    bildeUrl?: string
    pingvinPoengSum: number
    aktiveVerv: InternKortVerv[]
    dagensOrd: string
}

const tierMapping: Record<string, number> = {
    null: 0,
    "1": 1,
    "0": 2,
    "2": 3,
    "3": 4,
}

const mapTier = (rabattTrinn: RabattTrinn): number => {
    const key = rabattTrinn === null ? "null" : String(rabattTrinn)
    return tierMapping[key] ?? 0
}

const cloneVerv = (verv: InternKortVerv): InternKortVerv => ({
    navn: verv.navn,
    gruppe: verv.gruppe,
    signertKontrakt: verv.signertKontrakt,
    rabattTrinn: verv.rabattTrinn,
})

const createPingvinRole = (): InternKortVerv => ({
    navn: "Pingvin",
    gruppe: "Pingvin Ordenen",
    signertKontrakt: true,
    rabattTrinn: 3,
})

const getHighestTierVervInternal = (user: User): InternKortVerv | null => {
    // Pingvin should always be treated as highest tier with at least tier 3.
    if (user.pingvinPoengSum >= 14) {
        return createPingvinRole()
    }

    const activeVerv = user.aktiveVerv.map(cloneVerv)

    let highest: InternKortVerv | null = null
    for (const verv of activeVerv) {
        if (!highest || mapTier(verv.rabattTrinn) > mapTier(highest.rabattTrinn)) {
            highest = cloneVerv(verv)
        }
    }

    return highest
}

export const getHighestTier = (user: User): number => {
    if (user.aktiveVerv.length === 0 && user.pingvinPoengSum < 14) {
        return 0
    }
    return getHighestTierVervInternal(user)?.rabattTrinn ?? 0
}

export const getHighestTierGroup = (user: User): string => {
    if (user.aktiveVerv.length === 0 && user.pingvinPoengSum < 14) {
        return ""
    }
    return getHighestTierVervInternal(user)?.gruppe ?? ""
}

export const getHighestTierName = (user: User): string => {
    if (user.aktiveVerv.length === 0 && user.pingvinPoengSum < 14) {
        return ""
    }
    return getHighestTierVervInternal(user)?.navn ?? ""
}

export const createDemoUser = (): User => ({
    id: 0,
    fornavn: "Sir Nils Olav",
    etternavn: "III",
    fodselsdato: new Date(2000, 0, 1),
    opprettet: new Date(),
    gyldigTil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    pingvinPoengSum: 42,
    aktiveVerv: [
        {
            navn: "Utvikler",
            gruppe: "E-Tjenesten",
            signertKontrakt: true,
            rabattTrinn: 3,
        },
        {
            navn: "Medlem",
            gruppe: "PR-Etaten",
            signertKontrakt: false,
            rabattTrinn: 2,
        },
    ],
    dagensOrd: "eplepingvin",
    bildeUrl: "assets/images/nils.jpg",
})
