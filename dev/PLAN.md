# Plan for de næste udvidelser

Skrevet 4. oktober 2026. Udarbejdet med AI (Claude) og med begrænset mennesketjek.

Spillet er til en pige på 5 år. Alt skal være enkelt, tydeligt og kunne forstås uden at læse (teksterne bliver læst højt).

## Sådan arbejder vi
- Spillet er én fil: `index.html`. Fælles grundlag er på plads: handlingsknappen (E), krogene `HOOKS`, fællesobjektet `FX`, `P.mod` til at ændre gang, og to pladser i filen hvor nye dele sættes ind:
  `// (feature world blocks go here)` og `// (feature logic blocks go here)`.
- Hver del laves af sin egen underagent i sin egen testkopi (lav dem med `dev/make_test_copies.py`). Fælles regler og alle detaljer om koordinater og hjælpefunktioner står i `dev/BRIEF.md`.
- Hovedagenten sætter delene sammen, får en separat agent til at teste, retter fejl og lægger det på GitHub, før næste opgave.

## Opgave 1: Indendørs og udendørs sjov (fem underagenter) - FÆRDIG 4. oktober 2026
Alle fem dele er bygget, sat sammen og testet af en separat agent. Indersiden af salen og 1. sal tegnes kun, når kameraet er tæt på de gule huse (grupperne `WING_IN` og `WING_DYN`), så spillet ikke bliver tungere udendørs. Den hemmelige mus har id 12 og tæller ikke med i "af 12" (`nFound()`).

1. **salen** (stueetagen i de gule huse): rulleskøjter man kan tage på i salen, scenen med tæppe der går til side, spotlys, klapsalver og "Dans", en kurv med bløde bolde der flyver rundt, lyskontakt der slukker lyset og tænder stjerner i loftet, og garderoben hvor man kan skifte farve på jakken.
2. **sal1** (1. sal, struktur): rigtige lokaler med vægge og døre. Dørene låses op, efterhånden som hun finder dyr (1 dyr: Musik, 2: Billedkunst, 3: Bibliotek, 4-7: klasselokalerne). Møbler i de fire klasselokaler. En hemmelig mus som 13. dyr. Leverer også `wing_floor1.js`, der erstatter afsnittet mellem `// >>> WING FIRST FLOOR` og `// <<< WING FIRST FLOOR`.
3. **rum** (indholdet i tre lokaler på 1. sal): musiklokale med gulvklaver, tromme og xylofon, billedkunst med en tavle man kan tegne på (tegningen bliver hængende), og et bibliotek hvor der bliver læst korte historier om dyrene op.
4. **ude**: klappe de dyr man har fundet (hjerter og lyd), sæbebobler (knap og B), fyrværkeri og konfetti når alle 12 dyr er fundet, skoleklokken der ringer hvert 4. minut, og uret på hovedbygningen der slår hvert kvarter og hver hele time.
5. **vinter**: en Vinter-knap (og O) der skifter til sne: snevejr, hvidt på jorden, tagene og træerne, hue og halstørklæde på pigen, fodspor i sneen og tre steder hvor man kan bygge en snemand trin for trin.

## Opgave 2: Turen hjem fra skolen
- Byg den korte gåtur (ca. 750 m) fra skolen og hjem til familien, så man kan gå hele vejen. Adressen og et skærmbillede af ruten gives i samtalen. Adressen må ikke stå i det offentlige spil eller i denne fil: i spillet hedder stedet bare "Hjem".
- Find først gadenavne, hvordan husene ser ud langs ruten (rækkehuse, villaer, boligblokke), parken undervejs og hvordan huset derhjemme ser ud. Brug søgning på nettet og OpenStreetMap.
- Vejen skal hænge sammen med den skole, der allerede er bygget, og ende ved hoveddøren derhjemme.
