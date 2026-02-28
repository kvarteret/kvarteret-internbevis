export interface AppHeaderMenuAttributes {
    destructive?: boolean
    disabled?: boolean
    hidden?: boolean
}

export interface AppHeaderMenuItem {
    id?: string
    title: string
    subtitle?: string
    image?: string
    imageColor?: string
    attributes?: AppHeaderMenuAttributes
    state?: "on" | "off" | "mixed"
    subactions?: AppHeaderMenuItem[]
    displayInline?: boolean
}
