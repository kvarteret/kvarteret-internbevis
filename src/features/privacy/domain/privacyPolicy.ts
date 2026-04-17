import { SupportedLanguage } from "@/app/providers/LanguageProvider"

export const CURRENT_PRIVACY_POLICY_VERSION = "2026-04-17-1"

export const PRIVACY_POLICY_MARKDOWN: Record<SupportedLanguage, string> = {
    no: `# Personvernerklæring for Kvarteret

## Om appen
Denne appen (heretter kalt: Kvarteret) lar deg vise ditt digitale internbevis på Det Akademiske Kvarter.

## Hvilke personopplysninger vi behandler
Kvarteret behandler følgende personopplysninger:
- Navn
- E-postadresse
- Fødselsdato
- Verv og tilknytning i organisasjonen
- Profilbilde
- Medlemskapsstatus

## Hvordan vi bruker personopplysningene
Vi bruker personopplysningene utelukkende for å:
1. Verifisere din identitet ved innlogging
2. Vise ditt digitale medlemsbevis
3. Vise din status og dine rettigheter i organisasjonen

## Datalagring
Kvarteret lagrer begrensede data lokalt på enheten for å forbedre ytelse og stabilitet. Dette kan inkludere hurtiglagret medlemsinformasjon, arrangementsinnhold og bilder. Lokale cache-data brukes kun for å gjøre Kvarteret raskere og mer robust, og oppdateres eller erstattes når nyere data er tilgjengelige.

## Sikkerhet
- Innlogging skjer via en sikker to-faktor autentisering med e-post

## Oppdateringstjenester og teknisk drift
Vi bruker Expo-tjenester, inkludert EAS Update og EAS Insights, for å levere appoppdateringer og følge med på teknisk drift av appen. Dette kan omfatte teknisk informasjon som appversjon, plattform, operativsystemversjon, oppdateringsadopsjon, prosjektidentifikator og en tilfeldig installasjonstoken som Expo bruker for å behandle oppdaterings- og brukshendelser. Vi bruker denne informasjonen for å drifte, vedlikeholde, feilsøke og forbedre appen.

## Valgfri produktanalyse
Hvis du velger å tillate analyse, bruker vi PostHog Cloud med datalagring i EU for produktanalyse og funnel-måling på tvers av Kvarteret-appen og Kvarterets nettside. Dette kan omfatte skjermvisninger, navigasjon, innloggingsflyt, tilbakemeldingsinnsendinger og klikk på lenker eller knapper som hjelper oss å forstå om brukere finner frem til arrangementer, kjøper billetter eller vurderer å bli frivillige. Disse dataene brukes til å forbedre brukeropplevelsen, innholdet og konverteringen i våre digitale flater, ikke til annonsering. Analyse er valgfritt og kan slås av igjen i appens innstillinger.

## Deling av personopplysninger
Vi selger ikke dine personopplysninger og deler dem ikke med tredjeparter for annonseringsformål. Vi bruker tjenesteleverandører der det er nødvendig for å drifte appen, inkludert Expo for oppdateringslevering og teknisk drift. Hvis du velger å slå på analyse, bruker vi også PostHog for produktanalyse i EU. Informasjonen som vises i appen er ellers kun tilgjengelig for deg og autorisert personell på Kvarteret.

## Dine rettigheter
Du har rett til å:
- Få innsyn i hvilke personopplysninger vi har om deg
- Kreve retting av feilaktige opplysninger

## Endringer i personvernerklæringen
Vi forbeholder oss retten til å oppdatere denne personvernerklæringen. Større endringer vil bli varslet via e-post eller i appen.

## Kontaktinformasjon
For spørsmål om personvern eller utøvelse av dine rettigheter, kontakt:
**E-post:** it.leder@kvarteret.no

**Adresse:** Det Akademiske Kvarter, Olav Kyrres gate 49, 5015 Bergen

Sist oppdatert: [17/04/2026]`,
    en: `# Privacy Policy for Kvarteret

## About the App
This app (hereinafter referred to as: Kvarteret) lets you display your digital internal ID at Det Akademiske Kvarter.

## What Personal Data We Process
Kvarteret processes the following personal information:
- Name
- Email address
- Date of birth
- Positions and affiliations within the organization
- Profile picture
- Membership status

## How We Use Personal Data
We use personal data solely to:
1. Verify your identity during login
2. Display your digital membership ID
3. Show your status and rights within the organization

## Data Storage
Kvarteret stores limited data locally on the device to improve performance and reliability. This may include cached membership information, event content, and images. Local cache data is used only to make Kvarteret faster and more reliable, and is refreshed or replaced when newer data is available.

## Security
- Login is done through secure two-factor authentication with email

## Update Services and Technical Operations
We use Expo services, including EAS Update and EAS Insights, to deliver app updates and monitor the app's technical operation. This may include technical information such as app version, platform, operating system version, update adoption, project identifier, and a randomized installation token used by Expo to process update and usage events. We use this information to operate, maintain, troubleshoot, and improve the app.

## Optional Product Analytics
If you choose to allow analytics, we use PostHog Cloud with data hosting in the EU for product analytics and funnel measurement across the Kvarteret app and the Kvarteret website. This may include screen views, navigation, login flow events, feedback submissions, and clicks on links or buttons that help us understand whether users discover events, buy tickets, or consider volunteering. We use this data to improve the product experience, content, and conversion across our digital surfaces, not for advertising. Analytics is optional and can be turned off again in the app settings.

## Sharing of Personal Data
We do not sell your personal data or share it with third parties for advertising purposes. We use service providers where necessary to operate the app, including Expo for update delivery and technical operations. If you choose to enable analytics, we also use PostHog for EU-hosted product analytics. The information displayed in the app is otherwise only accessible to you and authorized personnel at Kvarteret.

## Your Rights
You have the right to:
- Access what personal data we have about you
- Request correction of incorrect information

## Changes to the Privacy Policy
We reserve the right to update this privacy policy. Significant changes will be notified via email or in the app.

## Contact Information
For questions about privacy or to exercise your rights, contact:
**Email:** it.leder@kvarteret.no

**Address:** Det Akademiske Kvarter, Olav Kyrres gate 49, 5015 Bergen

Last updated: [17/04/2026]`,
}
