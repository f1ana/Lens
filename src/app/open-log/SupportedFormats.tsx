import type { GameTheme } from '@/model/seed'

interface SupportedFormatsProps {
  formats: { name: string; supported?: string; theme?: GameTheme }[]
}

export function SupportedFormats({ formats }: SupportedFormatsProps) {
  return (
    <section
      aria-labelledby="supported-heading"
      className="flex flex-col items-center gap-2 text-center"
    >
      <h2
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        id="supported-heading"
      >
        Supported
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {formats.map(({ name, supported, theme }) => (
          <li
            className="flex flex-wrap items-center justify-center gap-x-2"
            key={name}
          >
            {/* Previews the colors the port's logs open in, split so they don't blend */}
            {theme ? (
              <span
                aria-hidden
                className="size-2.5 rounded-full bg-linear-to-br from-primary from-50% to-highlight to-50%"
                data-game={theme}
              />
            ) : null}
            <span className="font-medium">{name}</span>
            {supported ? (
              <span className="text-muted-foreground">{supported}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
