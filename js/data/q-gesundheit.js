// SPDX-License-Identifier: Apache-2.0
// Fragenpool: Gesundheit & Erste Hilfe, Hufe & Beschlag, Verhalten & Umgang

export default [

  /* ------------------------------------------------------ GESUNDHEIT */
  {
    id: 'ge01', cat: 'gesundheit', level: 'basis', type: 'number',
    q: 'Wie hoch ist die normale Körpertemperatur eines erwachsenen Pferdes in Ruhe (in °C)?',
    a: 37.8, tol: 0.5, unit: '°C',
    explain: 'Normal sind ca. 37,3–38,0 °C (Fohlen bis ca. 38,5 °C). Gemessen wird rektal. Ab ca. 38,5 °C spricht man von Fieber.'
  },
  {
    id: 'ge02', cat: 'gesundheit', level: 'aufbau', type: 'single',
    q: 'Wie hoch ist der Ruhepuls eines erwachsenen Pferdes?',
    options: ['28–40 Schläge/Minute', '60–80 Schläge/Minute', '10–15 Schläge/Minute', '90–110 Schläge/Minute'],
    a: 0,
    explain: 'Ruhepuls: ca. 28–40 Schläge/Min. Er wird an der Unterkieferarterie (Ganasche) oder mit dem Stethoskop hinter dem linken Ellenbogen gemessen.'
  },
  {
    id: 'ge03', cat: 'gesundheit', level: 'aufbau', type: 'single',
    q: 'Wie viele Atemzüge macht ein gesundes Pferd in Ruhe pro Minute?',
    options: ['8–16', '25–35', '2–5', '40–50'],
    a: 0,
    explain: 'Etwa 8–16 Atemzüge pro Minute. Gezählt wird an der Flanke oder den Nüstern – ein Ein- und Ausatmen zählt als ein Atemzug.'
  },
  {
    id: 'ge04', cat: 'gesundheit', level: 'basis', type: 'multi',
    q: 'Welche Anzeichen deuten auf eine Kolik hin?',
    options: [
      'Scharren und Unruhe',
      'Blick zum Bauch, Flehmen',
      'Häufiges Hinlegen und Wälzen',
      'Schwitzen ohne Anstrengung',
      'Gieriges Fressen mit gutem Appetit'
    ],
    a: [0, 1, 2, 3],
    explain: 'Weitere Anzeichen: fehlender Kotabsatz, kein Appetit, erhöhter Puls, angestrengte Atmung. Kolik ist immer ein Notfall – sofort den Tierarzt rufen.'
  },
  {
    id: 'ge05', cat: 'gesundheit', level: 'basis', type: 'single',
    q: 'Was ist bei Verdacht auf Kolik das Wichtigste?',
    options: [
      'Sofort den Tierarzt verständigen und das Pferd beobachten',
      'Sofort viel Kraftfutter anbieten',
      'Das Pferd allein in der Box lassen und abwarten',
      'Selbst ein Schmerzmittel spritzen'
    ],
    a: 0,
    explain: 'Tierarzt rufen, Futter wegnehmen, Wasser anbieten, das Pferd beobachten und bei Wälzgefahr vorsichtig führen. Keine eigenmächtigen Medikamente – sie verschleiern die Symptome.'
  },
  {
    id: 'ge06', cat: 'gesundheit', level: 'aufbau', type: 'multi',
    q: 'Woran erkennt man ein gesundes Pferd?',
    options: [
      'Glänzendes Fell und aufmerksamer Blick',
      'Gleichmäßige Atmung und normale Temperatur',
      'Normaler Kot- und Harnabsatz',
      'Gutes Fressverhalten',
      'Ständig hängender Kopf und Teilnahmslosigkeit'
    ],
    a: [0, 1, 2, 3],
    explain: 'Apathie, stumpfes Fell, Nasenausfluss, Husten, Appetitlosigkeit oder verändertes Verhalten sind Warnzeichen und gehören kontrolliert.'
  },
  {
    id: 'ge07', cat: 'gesundheit', level: 'aufbau', type: 'text',
    q: 'Wie heißt die hoch ansteckende bakterielle Erkrankung mit Fieber, eitrigem Nasenausfluss und geschwollenen Kehlgangslymphknoten?',
    a: ['Druse'],
    explain: 'Die Druse wird durch Streptococcus equi ausgelöst. Erkrankte Pferde müssen sofort isoliert werden, strikte Hygiene ist Pflicht (eigene Geräte, Handschuhe).'
  },
  {
    id: 'ge08', cat: 'gesundheit', level: 'aufbau', type: 'single',
    q: 'Was ist Hufrehe?',
    options: [
      'Eine schmerzhafte Entzündung der Huflederhaut',
      'Ein Bruch des Hufbeins',
      'Eine Pilzerkrankung des Strahls',
      'Eine Entzündung der Beugesehne'
    ],
    a: 0,
    explain: 'Auslöser sind u. a. Futterfehler (Getreide, junges Gras), Überbelastung, Vergiftungen und Stoffwechselerkrankungen. Typisch ist die Trachtenfußung mit vorgestellten Vorderbeinen. Sofort Tierarzt rufen.'
  },
  {
    id: 'ge09', cat: 'gesundheit', level: 'profi', type: 'match',
    q: 'Ordne jeder Erkrankung das typische Merkmal zu.',
    pairs: [
      ['Mauke', 'Entzündete, verkrustete Fesselbeuge'],
      ['Strahlfäule', 'Übelriechender, zersetzter Strahl'],
      ['Sommerekzem', 'Juckreiz an Mähnenkamm und Schweifrübe'],
      ['Kreuzverschlag', 'Harte, schmerzhafte Kruppenmuskulatur nach Belastung']
    ],
    explain: 'Mauke entsteht bei Nässe und Schmutz, Strahlfäule bei mangelnder Hufpflege und feuchter Einstreu, Sommerekzem durch Reaktion auf Stiche der Kriebelmücke.'
  },
  {
    id: 'ge10', cat: 'gesundheit', level: 'basis', type: 'multi',
    q: 'Was gehört in eine Stallapotheke?',
    options: [
      'Verbandmaterial und Wundauflagen',
      'Fieberthermometer',
      'Desinfektionsmittel',
      'Schere und Einweghandschuhe',
      'Verschreibungspflichtige Schmerzmittel auf Vorrat'
    ],
    a: [0, 1, 2, 3],
    explain: 'Zusätzlich sinnvoll: Kühlpacks, elastische Binden, Watte, Wunddesinfektion, Zeckenzange und die Notfallnummern von Tierarzt und Hufschmied. Medikamente nur nach tierärztlicher Anweisung.'
  },
  {
    id: 'ge11', cat: 'gesundheit', level: 'aufbau', type: 'truefalse',
    q: 'Bei einer stark blutenden Wunde legt man einen Druckverband an und ruft den Tierarzt.',
    a: true,
    explain: 'Ruhe bewahren, Pferd sichern, Blutung durch Druckverband stillen, Wunde nicht mit Puder oder Hausmitteln behandeln und den Tierarzt verständigen. Tetanusschutz prüfen.'
  },
  {
    id: 'ge12', cat: 'gesundheit', level: 'aufbau', type: 'multi',
    q: 'Gegen welche Krankheiten werden Pferde üblicherweise geimpft?',
    options: ['Tetanus (Wundstarrkrampf)', 'Influenza (Pferdegrippe)', 'Herpes (EHV)', 'Tollwut', 'Hufrehe'],
    a: [0, 1, 2, 3],
    explain: 'Tetanus und Influenza gelten als Basisimpfungen; Herpes und Tollwut werden je nach Bestand und Nutzung empfohlen. Hufrehe ist keine Infektionskrankheit und nicht impfbar.'
  },
  {
    id: 'ge13', cat: 'gesundheit', level: 'profi', type: 'single',
    q: 'Wie wird der Wurmbefall heute bevorzugt kontrolliert?',
    options: [
      'Selektive Entwurmung nach Kotprobenuntersuchung',
      'Jeden Monat entwurmen',
      'Nur entwurmen, wenn Würmer im Kot sichtbar sind',
      'Gar nicht, das regelt die Weide'
    ],
    a: 0,
    explain: 'Kotproben zeigen den tatsächlichen Befall und vermeiden Resistenzen. Ergänzend: Weidehygiene, Abäppeln, Wechselweiden. Bandwurm und Magendasseln werden zusätzlich strategisch behandelt.'
  },
  {
    id: 'ge14', cat: 'gesundheit', level: 'profi', type: 'single',
    q: 'Wie prüft man am stehenden Pferd schnell die Durchblutung?',
    options: [
      'Kapillarfüllungszeit an der Maulschleimhaut prüfen (< 2 Sekunden)',
      'Am Huf klopfen',
      'Die Ohren fühlen',
      'Den Schweif anheben'
    ],
    a: 0,
    explain: 'Auf die Schleimhaut drücken: Die weiße Stelle sollte sich in unter 2 Sekunden wieder rosa färben. Blasse, bläuliche oder ziegelrote Schleimhäute sind Alarmzeichen.'
  },
  {
    id: 'ge15', cat: 'gesundheit', level: 'aufbau', type: 'single',
    q: 'Ein Pferd hustet beim Antraben mehrfach und hat weißlichen Nasenausfluss. Was ist richtig?',
    options: [
      'Arbeit beenden, Ursachen prüfen (Staub, Heuqualität) und Tierarzt hinzuziehen',
      'Weiterreiten, bis der Husten aufhört',
      'Sofort das Pferd longieren',
      'Das Pferd zudecken und nichts weiter tun'
    ],
    a: 0,
    explain: 'Husten ist immer ernst zu nehmen. Staubarme Haltung (Heu bedampfen, Späne), gute Lüftung und tierärztliche Abklärung verhindern chronische Atemwegserkrankungen.'
  },

  /* ------------------------------------------------------------ HUFE */
  {
    id: 'hu01', cat: 'hufe', level: 'basis', type: 'single',
    q: 'In welche Richtung kratzt man den Huf aus?',
    options: [
      'Von der Trachte zur Zehe hin',
      'Von der Zehe zur Trachte hin',
      'Quer über den Strahl',
      'Kreisförmig um die Sohle'
    ],
    a: 0,
    explain: 'Von hinten (Trachte) nach vorne (Zehe) arbeiten – so rutscht der Hufkratzer nicht in den empfindlichen Ballen. Besonders die Strahlfurchen gründlich säubern.'
  },
  {
    id: 'hu02', cat: 'hufe', level: 'basis', type: 'text',
    q: 'Wie heißt das elastische, keilförmige Horngebilde in der Mitte der Hufsohle, das für Stoßdämpfung und Durchblutung wichtig ist?',
    a: ['Strahl'],
    explain: 'Der Strahl wirkt beim Auffußen wie eine Pumpe (Hufmechanismus) und fördert so die Durchblutung des Hufes.'
  },
  {
    id: 'hu03', cat: 'hufe', level: 'aufbau', type: 'number',
    q: 'Nach wie vielen Wochen sollte die Hufbearbeitung durch den Schmied in der Regel spätestens erfolgen?',
    a: 8, tol: 2, unit: 'Wochen',
    explain: 'Üblich sind 6–8 Wochen. Zu lange Intervalle führen zu Fehlstellungen, ausbrechendem Horn und Zwanghufen.'
  },
  {
    id: 'hu04', cat: 'hufe', level: 'aufbau', type: 'multi',
    q: 'Welche Teile gehören zum Huf?',
    options: ['Tragrand', 'Strahl', 'Eckstreben', 'Weiße Linie', 'Ganasche'],
    a: [0, 1, 2, 3],
    explain: 'Weitere Hufteile: Hufwand (Zehen-, Seiten-, Trachtenwand), Sohle, Ballen, Kronrand. Die Ganasche gehört zum Kopf.'
  },
  {
    id: 'hu05', cat: 'hufe', level: 'profi', type: 'single',
    q: 'Was versteht man unter dem Hufmechanismus?',
    options: [
      'Das Weiten und Zusammenziehen des Hufes bei Be- und Entlastung',
      'Das Anpassen des Eisens an den Huf',
      'Die Drehbewegung im Hufgelenk',
      'Das Wachstum des Hufhorns'
    ],
    a: 0,
    explain: 'Beim Auffußen weitet sich der Huf im Trachtenbereich, beim Abfußen zieht er sich zusammen. Das fördert die Durchblutung und dämpft Stöße – Bewegung ist deshalb Hufpflege.'
  },
  {
    id: 'hu06', cat: 'hufe', level: 'aufbau', type: 'truefalse',
    q: 'Das Hufhorn wächst am Kronrand nach und braucht etwa 9–12 Monate, bis es einmal komplett nachgewachsen ist.',
    a: true,
    explain: 'Das Horn wächst ca. 6–10 mm im Monat. Ein kompletter Hufwechsel dauert bei Vorderhufen etwa ein Jahr – Hornschäden brauchen also lange, um herauszuwachsen.'
  },
  {
    id: 'hu07', cat: 'hufe', level: 'basis', type: 'multi',
    q: 'Woran erkennt man, dass ein Beschlag erneuert werden muss?',
    options: [
      'Das Eisen sitzt locker oder klappert',
      'Nietenden stehen ab',
      'Der Tragrand steht deutlich über das Eisen hinaus',
      'Das Eisen ist stark abgelaufen',
      'Das Pferd hat frisch gewaschene Hufe'
    ],
    a: [0, 1, 2, 3],
    explain: 'Auch verschobene Eisen, verlorene Nägel oder ausbrechendes Horn sind Gründe. Vor jedem Reiten den Sitz der Eisen kontrollieren.'
  },
  {
    id: 'hu08', cat: 'hufe', level: 'profi', type: 'single',
    q: 'Welche Aussage zur „weißen Linie" ist richtig?',
    options: [
      'Sie ist die Verbindungszone zwischen Hufwand und Sohle und dient dem Schmied als Orientierung beim Nageln',
      'Sie ist ein Teil des Strahls',
      'Sie zeigt das Alter des Pferdes an',
      'Sie liegt am Kronrand'
    ],
    a: 0,
    explain: 'Außerhalb der weißen Linie liegt unempfindliches Wandhorn, innerhalb die empfindliche Lederhaut. Nägel dürfen nur in der Wand sitzen.'
  },
  {
    id: 'hu09', cat: 'hufe', level: 'aufbau', type: 'single',
    q: 'Ein Pferd lahmt plötzlich stark, der Huf ist warm und pulsiert. Was ist die wahrscheinlichste Ursache?',
    options: ['Hufgeschwür', 'Sommerekzem', 'Druse', 'Sattelzwang'],
    a: 0,
    explain: 'Vermehrte Hufwärme und verstärkte Pulsation an der Fesselarterie deuten auf eine Entzündung im Huf hin – typisch für Hufgeschwür oder Hufrehe. Tierarzt bzw. Hufschmied hinzuziehen.'
  },
  {
    id: 'hu10', cat: 'hufe', level: 'basis', type: 'truefalse',
    q: 'Auch Barhufpferde brauchen regelmäßige Hufbearbeitung.',
    a: true,
    explain: 'Ohne Beschlag muss das Horn regelmäßig ausgeschnitten und ausbalanciert werden, sonst entstehen Fehlbelastungen und Hornausbrüche.'
  },

  /* ----------------------------------------------- VERHALTEN & UMGANG */
  {
    id: 've01', cat: 'verhalten', level: 'basis', type: 'multi',
    q: 'Welche Grundeigenschaften prägen das Verhalten des Pferdes?',
    options: ['Fluchttier', 'Herdentier', 'Lauftier', 'Dauerfresser', 'Einzelgänger und Raubtier'],
    a: [0, 1, 2, 3],
    explain: 'Aus diesen Eigenschaften leiten sich alle Regeln im Umgang ab: ruhig ansprechen, Sozialkontakt und Bewegung ermöglichen, kontinuierlich Raufutter anbieten.'
  },
  {
    id: 've02', cat: 'verhalten', level: 'basis', type: 'single',
    q: 'Wie nähert man sich einem Pferd in der Box korrekt?',
    options: [
      'Ruhig ansprechen und von vorne seitlich herantreten',
      'Leise von hinten anschleichen',
      'Schnell hineingehen, damit es nicht ausbüxt',
      'Erst die Tür aufreißen und laut rufen'
    ],
    a: 0,
    explain: 'Direkt vor der Stirn und hinter der Kruppe liegt der blinde Fleck. Ansprechen, abwarten, dann seitlich an Schulter oder Hals berühren.'
  },
  {
    id: 've03', cat: 'verhalten', level: 'basis', type: 'multi',
    q: 'Welche Signale zeigen Unbehagen oder Abwehr beim Pferd?',
    options: [
      'Angelegte Ohren',
      'Schlagen mit dem Schweif',
      'Drohen mit aufgerissenen Nüstern und gestrecktem Hals',
      'Weiß sichtbares Augenweiß und angespannte Muskulatur',
      'Entspannt hängende Unterlippe beim Dösen'
    ],
    a: [0, 1, 2, 3],
    explain: 'Pferde kommunizieren über Körpersprache. Wer Ohren, Augen, Maul, Schweif und Körperspannung liest, erkennt Konflikte frühzeitig.'
  },
  {
    id: 've04', cat: 'verhalten', level: 'aufbau', type: 'single',
    q: 'Wie führt man ein Pferd sicher?',
    options: [
      'In Höhe des Pferdekopfes bzw. der Schulter, Strick locker in der Hand, nie um die Hand gewickelt',
      'Direkt vor dem Pferd gehen und den Strick straff ziehen',
      'Weit hinter dem Pferd bleiben',
      'Den Strick mehrfach um die Hand wickeln, um mehr Halt zu haben'
    ],
    a: 0,
    explain: 'Der Strick wird locker in Schlaufen gehalten – niemals um Hand oder Arm wickeln (Verletzungsgefahr beim Losreißen). Beim Führen auf der Straße und im Turnierbereich Handschuhe tragen.'
  },
  {
    id: 've05', cat: 'verhalten', level: 'basis', type: 'text',
    q: 'Wie heißt der Knoten, mit dem ein Pferd so angebunden wird, dass er sich im Notfall schnell mit einem Zug lösen lässt?',
    a: ['Sicherheitsknoten', 'Panikknoten'],
    explain: 'Angebunden wird immer mit Sicherheitsknoten – idealerweise an einem Strick mit Sollbruchstelle bzw. Panikhaken und in Kopfhöhe, damit sich das Pferd nicht verfängt.'
  },
  {
    id: 've06', cat: 'verhalten', level: 'aufbau', type: 'order',
    q: 'Bringe die Arbeitsschritte beim Putzen und Fertigmachen in eine sinnvolle Reihenfolge.',
    items: ['Pferd anbinden', 'Hufe auskratzen', 'Fell putzen', 'Satteln', 'Trensen'],
    explain: 'Erst Hufe auskratzen und kontrollieren, dann putzen, dann satteln, zuletzt trensen. Der Sattelgurt wird schrittweise nachgegurtet.'
  },
  {
    id: 've07', cat: 'verhalten', level: 'basis', type: 'match',
    q: 'Ordne jedes Putzzeug seiner Aufgabe zu.',
    pairs: [
      ['Hufkratzer', 'Hufe reinigen'],
      ['Kardätsche', 'Feinen Staub aus dem Fell holen'],
      ['Striegel', 'Kardätsche reinigen und groben Schmutz lösen'],
      ['Wurzelbürste', 'Getrockneten Schmutz von Beinen bürsten']
    ],
    explain: 'Der Gummistriegel dient zum Lösen von grobem Schmutz auf großen Muskelpartien, der Metallstriegel ausschließlich zum Säubern der Kardätsche – niemals am Pferd.'
  },
  {
    id: 've08', cat: 'verhalten', level: 'aufbau', type: 'truefalse',
    q: 'Ein Pferd lernt vor allem durch das sofortige Aufhören des Drucks bzw. durch unmittelbares Lob.',
    a: true,
    explain: 'Pferde verknüpfen nur, was innerhalb von etwa 1–3 Sekunden auf ihr Verhalten folgt. Timing ist deshalb wichtiger als Stärke der Einwirkung. Strafe im Nachhinein ist wirkungslos und schädlich.'
  },
  {
    id: 've09', cat: 'verhalten', level: 'profi', type: 'single',
    q: 'Was versteht man unter „Habituation" (Gewöhnung)?',
    options: [
      'Das Pferd reagiert auf einen wiederholten, folgenlosen Reiz immer weniger',
      'Das Pferd lernt einen Reiz mit Futter zu verknüpfen',
      'Das Pferd verlernt eine Lektion',
      'Das Pferd flüchtet stärker als zuvor'
    ],
    a: 0,
    explain: 'Gewöhnung ist die Basis jeder Gelassenheitsschulung: Reiz in geringer Intensität anbieten, abwarten, bis das Pferd entspannt, dann steigern. Zu starke Reize führen dagegen zur Sensibilisierung.'
  },
  {
    id: 've10', cat: 'verhalten', level: 'aufbau', type: 'single',
    q: 'Warum kauen und schmatzen Fohlen gegenüber älteren Pferden („Unterlegenheitsgebärde")?',
    options: [
      'Sie signalisieren damit friedliche Absichten',
      'Sie haben Hunger',
      'Sie fordern zum Spielen auf',
      'Sie zeigen Schmerzen an'
    ],
    a: 0,
    explain: 'Das Kaubewegungs-Signal (Unterlegenheitsgebärde) beschwichtigt ranghöhere Pferde und verhindert Angriffe.'
  },
  {
    id: 've11', cat: 'verhalten', level: 'profi', type: 'multi',
    q: 'Welche Verhaltensstörungen können durch nicht artgerechte Haltung entstehen?',
    options: ['Koppen', 'Weben', 'Boxenlaufen', 'Holz benagen', 'Wälzen nach dem Weidegang'],
    a: [0, 1, 2, 3],
    explain: 'Stereotypien entstehen durch Bewegungsmangel, Langeweile, fehlenden Sozialkontakt und zu lange Fresspausen. Wälzen dagegen ist völlig normales Komfortverhalten.'
  },
  {
    id: 've12', cat: 'verhalten', level: 'aufbau', type: 'truefalse',
    q: 'Pferde können auch im Stehen schlafen, für den Tiefschlaf müssen sie sich jedoch hinlegen.',
    a: true,
    explain: 'Durch den Spannsäge-Mechanismus (Stehapparat) dösen Pferde im Stehen. REM-Schlaf ist nur im Liegen möglich – deshalb brauchen sie eine sichere, ausreichend große Liegefläche.'
  },
  {
    id: 've13', cat: 'verhalten', level: 'basis', type: 'single',
    q: 'Von welcher Seite wird ein Pferd üblicherweise geführt, gesattelt und bestiegen?',
    options: ['Von links', 'Von rechts', 'Immer von hinten', 'Von vorne'],
    a: 0,
    explain: 'Traditionell von links. Trotzdem sollte ein gut ausgebildetes Pferd auch von rechts geführt und bestiegen werden können.'
  },
  {
    id: 've14', cat: 'verhalten', level: 'aufbau', type: 'multi',
    q: 'Welche Regeln gelten beim Umgang im Stall?',
    options: [
      'Nie direkt hinter dem Pferd durchgehen, ohne es anzusprechen',
      'Ruhig und leise arbeiten, nicht rennen',
      'Gänge frei von Werkzeug und Schubkarren halten',
      'Türen und Tore immer sichern',
      'Fremde Pferde ungefragt füttern'
    ],
    a: [0, 1, 2, 3],
    explain: 'Fremde Pferde werden nie ohne Erlaubnis gefüttert – wegen Allergien, Futterunverträglichkeiten und weil Handfüttern Aufdringlichkeit fördert.'
  },
  {
    id: 've15', cat: 'verhalten', level: 'profi', type: 'single',
    q: 'Ein Pferd erschrickt beim Ausreiten vor einer Plastikplane. Was ist die richtige Reaktion?',
    options: [
      'Ruhig bleiben, Sitz und Zügelverbindung sichern, das Pferd vorwärts geradeaus einwirken lassen und ihm Zeit geben',
      'Sofort scharf strafen',
      'Die Zügel loslassen und sich am Sattel festhalten',
      'Absteigen und das Pferd wegdrehen'
    ],
    a: 0,
    explain: 'Ruhe des Reiters überträgt sich. Ein erfahrener Partner kann vorangehen. Zwang verstärkt die Angst, Nachgeben in Panik gefährdet Reiter und Pferd.'
  }
];
