import { SupportedLanguage } from "@/app/providers/LanguageProvider"

export const PRIVACY_POLICY_MARKDOWN: Record<SupportedLanguage, string> = {
    no: `# Personvernerklæring for Studentersamfunnet Internbevis

## Om appen
Studentersamfunnet Internbevis er en app som lar aktive medlemmer i Studentersamfunnet se sitt medlemsbevis digitalt. Appen er utviklet for å gjøre det enklere for medlemmer å vise sitt medlemskap og trinnivå.

## Hvilke personopplysninger vi behandler
Appen behandler følgende personopplysninger:
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
Appen lagrer begrensede data lokalt på enheten for å forbedre ytelse og stabilitet. Dette kan inkludere hurtiglagret medlemsinformasjon, arrangementsinnhold og bilder. Lokale cache-data brukes kun for å gjøre appen raskere og mer robust, og oppdateres eller erstattes når nyere data er tilgjengelige.

## Sikkerhet
- Innlogging skjer via en sikker to-faktor autentisering med e-post

## Operasjonell telemetri og oppdateringstjenester
Vi bruker Expo-tjenester, inkludert EAS Update og EAS Insights, for å levere appoppdateringer og følge med på teknisk bruk av appen. Dette kan omfatte teknisk informasjon som appversjon, plattform, operativsystemversjon, oppdateringsadopsjon, prosjektidentifikator og en tilfeldig installasjonstoken som Expo bruker for å behandle oppdaterings- og brukshendelser. Vi bruker denne informasjonen for å drifte, vedlikeholde, feilsøke og forbedre appen. Denne telemetrien er ikke ment å identifisere deg direkte som enkeltperson.

## Deling av personopplysninger
Vi selger ikke dine personopplysninger og deler dem ikke med tredjeparter for annonseringsformål. Vi bruker tjenesteleverandører der det er nødvendig for å drifte appen, inkludert Expo for oppdateringslevering og operasjonell telemetri. Informasjonen som vises i appen er ellers kun tilgjengelig for deg og autorisert personell i Studentersamfunnet.

## Dine rettigheter
Du har rett til å:
- Få innsyn i hvilke personopplysninger vi har om deg
- Kreve retting av feilaktige opplysninger

For å utøve disse rettighetene, kontakt it-ansvarlig i Studentersamfunnet.

## Endringer i personvernerklæringen
Vi forbeholder oss retten til å oppdatere denne personvernerklæringen. Større endringer vil bli varslet via e-post eller i appen.

## Kontaktinformasjon
For spørsmål om personvern eller utøvelse av dine rettigheter, kontakt:
- E-post: pr.it@kvarteret.no
- Adresse: Det Akademiske Kvarter, Olav Kyrres gate 49, 5015 Bergen

Sist oppdatert: [02/03/2026]`,
    en: `# Privacy Policy for Studentersamfunnet Internbevis

## About the App
Studentersamfunnet Internbevis is an app that allows active members in Studentersamfunnet to view their membership ID digitally. The app is developed to make it easier for members to show their membership and access level.

## What Personal Data We Process
The app processes the following personal information:
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
The app stores limited data locally on the device to improve performance and reliability. This may include cached membership information, event content, and images. Local cache data is used only to make the app faster and more reliable, and is refreshed or replaced when newer data is available.

## Security
- Login is done through secure two-factor authentication with email

## Operational Telemetry and Update Services
We use Expo services, including EAS Update and EAS Insights, to deliver app updates and monitor technical app usage. This may include technical information such as app version, platform, operating system version, update adoption, project identifier, and a randomized installation token used by Expo to process update and usage events. We use this information to operate, maintain, troubleshoot, and improve the app. This telemetry is not intended to directly identify you as an individual user.

## Sharing of Personal Data
We do not sell your personal data or share it with third parties for advertising purposes. We use service providers where necessary to operate the app, including Expo for update delivery and operational telemetry. The information displayed in the app is otherwise only accessible to you and authorized personnel in Studentersamfunnet.

## Your Rights
You have the right to:
- Access what personal data we have about you
- Request correction of incorrect information

To exercise these rights, contact the IT manager in Studentersamfunnet.

## Changes to the Privacy Policy
We reserve the right to update this privacy policy. Significant changes will be notified via email or in the app.

## Contact Information
For questions about privacy or to exercise your rights, contact:
- Email: pr.it@kvarteret.no
- Address: Det Akademiske Kvarter, Olav Kyrres gate 49, 5015 Bergen

Last updated: [02/03/2026]`,
}
