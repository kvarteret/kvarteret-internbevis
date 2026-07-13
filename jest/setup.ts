// Side-effecting import: initializes i18next so component tests render real
// translated strings instead of literal keys. In the app this happens once
// at bootstrap; tests need it triggered explicitly per Jest worker.
import "@/app/localization/i18n"
