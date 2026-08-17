// SPDX-License-Identifier: Apache-2.0
// Fragenpool: Anatomie, Rassen/Farben, Haltung, Fütterung
// type: single | multi | truefalse | text | number | order | match

export default [

  /* ---------------------------------------------------------- ANATOMIE */
  {
    id: 'an01', cat: 'anatomie', level: 'basis', type: 'text',
    q: 'Wie heißt der höchste Punkt des Rückens am Übergang von Hals zu Rücken, an dem das Stockmaß gemessen wird?',
    a: ['Widerrist'],
    explain: 'Der Widerrist wird von den langen Dornfortsätzen der vorderen Brustwirbel gebildet. Das Stockmaß wird senkrecht vom Boden bis zum höchsten Punkt des Widerristes gemessen.'
  },
  {
    id: 'an02', cat: 'anatomie', level: 'basis', type: 'single',
    q: 'Welches Gelenk befindet sich direkt über dem Huf?',
    options: ['Hufgelenk', 'Fesselgelenk', 'Sprunggelenk', 'Karpalgelenk'],
    a: 0,
    explain: 'Das Hufgelenk liegt im Inneren des Hufes zwischen Kronbein und Hufbein. Darüber folgen Krongelenk und Fesselgelenk (Kötengelenk).'
  },
  {
    id: 'an03', cat: 'anatomie', level: 'aufbau', type: 'number',
    q: 'Aus wie vielen Halswirbeln besteht die Halswirbelsäule des Pferdes?',
    a: 7, tol: 0, unit: 'Wirbel',
    explain: 'Wie fast alle Säugetiere hat das Pferd 7 Halswirbel – vom kurzen Ponyhals bis zum langen Hals eines Warmbluts.'
  },
  {
    id: 'an04', cat: 'anatomie', level: 'basis', type: 'single',
    q: 'Wie nennt man die Region zwischen Kopf und Hals, an der das Genickstück der Trense aufliegt?',
    options: ['Genick', 'Ganasche', 'Mähnenkamm', 'Nüster'],
    a: 0,
    explain: 'Das Genick ist der höchste Punkt des Halses beim korrekt aufgerichteten Pferd. Die Ganaschen sind die hinteren Unterkieferäste.'
  },
  {
    id: 'an05', cat: 'anatomie', level: 'basis', type: 'multi',
    q: 'Welche Körperteile gehören zur Hinterhand?',
    options: ['Kruppe', 'Sprunggelenk', 'Buggelenk', 'Hinterbacke', 'Widerrist'],
    a: [0, 1, 3],
    explain: 'Die Hinterhand umfasst Kruppe, Hinterbacken, Hüfte, Oberschenkel, Sprunggelenk und Hinterbein. Bug und Widerrist gehören zur Vorhand.'
  },
  {
    id: 'an06', cat: 'anatomie', level: 'aufbau', type: 'single',
    q: 'Das Pferd ist von der Verdauung her ein …',
    options: ['Dickdarmverdauer und Dauerfresser', 'Wiederkäuer', 'Allesfresser mit großem Magen', 'Vormagenverdauer'],
    a: 0,
    explain: 'Der Magen des Pferdes ist mit ca. 8–15 Litern klein. Die eigentliche Verdauung der Rohfaser erfolgt mikrobiell im Dickdarm (v. a. Blind- und Grimmdarm). Deshalb: viele kleine Mahlzeiten, viel Raufutter.'
  },
  {
    id: 'an07', cat: 'anatomie', level: 'aufbau', type: 'truefalse',
    q: 'Ein Pferd kann sich bei Übelkeit durch Erbrechen entlasten.',
    a: false,
    explain: 'Pferde können nicht erbrechen – der Mageneingang wirkt wie ein Ventil. Deshalb sind Futterfehler und Gasbildung so gefährlich (Kolikgefahr, Magenüberladung).'
  },
  {
    id: 'an08', cat: 'anatomie', level: 'aufbau', type: 'number',
    q: 'Wie viele Zähne hat ein ausgewachsener Hengst (mit Hengstzähnen, ohne Wolfszähne)?',
    a: 40, tol: 0, unit: 'Zähne',
    explain: 'Hengste und Wallache haben in der Regel 40 Zähne, Stuten meist 36, da ihnen die Hengstzähne (Hakenzähne) fehlen.'
  },
  {
    id: 'an09', cat: 'anatomie', level: 'profi', type: 'order',
    q: 'Bringe die Knochen des Vorderbeins von oben nach unten in die richtige Reihenfolge.',
    items: ['Unterarmbein (Radius)', 'Vorderfußwurzelgelenk (Karpus)', 'Röhrbein', 'Fesselbein', 'Kronbein', 'Hufbein'],
    explain: 'Von oben nach unten: Radius – Karpalgelenk – Röhrbein – Fesselbein – Kronbein – Hufbein. Hinter dem Hufgelenk liegt zusätzlich das Strahlbein.'
  },
  {
    id: 'an10', cat: 'anatomie', level: 'basis', type: 'single',
    q: 'Wo liegt die Flanke des Pferdes?',
    options: [
      'Zwischen letzter Rippe und Hüfte',
      'Zwischen Vorderbein und Hals',
      'Unter dem Sattel auf Höhe des Widerristes',
      'Am Übergang von Kruppe zum Schweif'
    ],
    a: 0,
    explain: 'Die Flanke ist der weiche Bereich zwischen letzter Rippe und Hüfthöcker. Blicke zur Flanke sind ein typisches Kolikanzeichen.'
  },
  {
    id: 'an11', cat: 'anatomie', level: 'aufbau', type: 'match',
    q: 'Ordne die Körperteile der richtigen Region zu.',
    pairs: [
      ['Ganasche', 'Kopf'],
      ['Buggelenk', 'Vorhand'],
      ['Sprunggelenk', 'Hinterhand'],
      ['Nierenpartie', 'Mittelhand']
    ],
    explain: 'Vorhand: Kopf, Hals, Schulter, Bug, Widerrist, Vorderbeine. Mittelhand: Rücken, Nierenpartie, Brustkorb, Bauch. Hinterhand: Kruppe, Hüfte, Hinterbeine.'
  },
  {
    id: 'an12', cat: 'anatomie', level: 'profi', type: 'single',
    q: 'Welche Sehne verläuft an der Rückseite des Röhrbeins und ist bei Überlastung besonders verletzungsgefährdet?',
    options: ['Oberflächliche Beugesehne', 'Strecksehne', 'Nackenband', 'Kniescheibenband'],
    a: 0,
    explain: 'Die oberflächliche (und tiefe) Beugesehne verläuft hinten am Röhrbein. Eine Sehnenverletzung zeigt sich durch Wärme, Schwellung und Druckempfindlichkeit („warmer Strang").'
  },
  {
    id: 'an13', cat: 'anatomie', level: 'basis', type: 'text',
    q: 'Wie heißt der Bereich unterhalb des Fesselgelenks bis zum Huf?',
    a: ['Fessel', 'Fesselkopf'],
    explain: 'Die Fessel liegt zwischen Fesselgelenk und Krone. Der Übergang zum Huf heißt Krone bzw. Kronrand.'
  },
  {
    id: 'an14', cat: 'anatomie', level: 'aufbau', type: 'truefalse',
    q: 'Das Pferd hat ein fast rundum reichendes Blickfeld, aber direkt vor der Stirn und direkt hinter sich einen blinden Fleck.',
    a: true,
    explain: 'Durch die seitlich am Kopf sitzenden Augen sieht das Pferd fast 350° – jedoch nicht direkt vor der Stirn und nicht direkt hinter der Kruppe. Deshalb nie unangekündigt von hinten herantreten.'
  },
  {
    id: 'an15', cat: 'anatomie', level: 'profi', type: 'multi',
    q: 'Welche Aussagen zum Skelett des Pferdes sind richtig?',
    options: [
      'Die Schulter ist nicht knöchern mit dem Rumpf verbunden, sondern über Muskeln und Bänder',
      'Das Pferd fußt auf dem letzten Zehenglied',
      'Das Pferd besitzt ein Schlüsselbein',
      'Der Widerrist wird von Dornfortsätzen der Brustwirbel gebildet'
    ],
    a: [0, 1, 3],
    explain: 'Pferde haben kein Schlüsselbein – der Rumpf hängt in einer Muskelschlinge zwischen den Vorderbeinen. Das Pferd ist ein Zehenspitzengänger und fußt auf dem Hufbein (letztes Zehenglied).'
  },

  /* ------------------------------------------------- RASSEN & FARBEN */
  {
    id: 'ra01', cat: 'rassen', level: 'basis', type: 'single',
    q: 'Ein Pferd mit braunem Deckhaar sowie schwarzer Mähne, schwarzem Schweif und schwarzen Beinen ist ein …',
    options: ['Brauner', 'Fuchs', 'Rappe', 'Falbe'],
    a: 0,
    explain: 'Beim Braunen ist das Langhaar und das untere Bein schwarz. Beim Fuchs sind Deckhaar und Langhaar rotbraun bis hell, beim Rappen alles schwarz.'
  },
  {
    id: 'ra02', cat: 'rassen', level: 'basis', type: 'truefalse',
    q: 'Ein Schimmel wird weiß geboren.',
    a: false,
    explain: 'Schimmel werden dunkel geboren und hellen mit den Jahren auf. Die Haut bleibt dunkel pigmentiert. Ein tatsächlich weiß geborenes Pferd ist ein „Weißgeborener" (White).'
  },
  {
    id: 'ra03', cat: 'rassen', level: 'aufbau', type: 'match',
    q: 'Ordne die Kopfabzeichen der richtigen Beschreibung zu.',
    pairs: [
      ['Stern', 'Fleck auf der Stirn'],
      ['Blesse', 'Breiter Streifen von der Stirn bis zur Nase'],
      ['Schnippe', 'Weiße Stelle zwischen den Nüstern'],
      ['Laterne', 'Weiß über Augen und Nüstern hinaus ausgedehnt']
    ],
    explain: 'Weitere Abzeichen: Flocke (kleiner Stern), Strich bzw. schmale Blesse, geteilte oder unterbrochene Blesse.'
  },
  {
    id: 'ra04', cat: 'rassen', level: 'aufbau', type: 'number',
    q: 'Bis zu welchem Stockmaß (in cm, ohne Hufeisen) gilt ein Pferd als Pony?',
    a: 148, tol: 0, unit: 'cm',
    explain: 'Bis einschließlich 148 cm Stockmaß (ohne Beschlag) gilt ein Pferd als Pony; darüber als Großpferd. Mit Beschlag liegt die Grenze bei 149 cm.'
  },
  {
    id: 'ra05', cat: 'rassen', level: 'basis', type: 'multi',
    q: 'Welche der genannten Rassen sind deutsche Warmblutrassen?',
    options: ['Hannoveraner', 'Holsteiner', 'Shetlandpony', 'Oldenburger', 'Shire Horse'],
    a: [0, 1, 3],
    explain: 'Deutsche Reitpferderassen sind u. a. Hannoveraner, Holsteiner, Oldenburger, Westfale, Trakehner, Bayerisches Warmblut. Shire Horse ist ein Kaltblut, Shetlandpony ein Pony.'
  },
  {
    id: 'ra06', cat: 'rassen', level: 'aufbau', type: 'single',
    q: 'Welche Rasse zählt zu den Vollblutrassen?',
    options: ['Englisches Vollblut', 'Haflinger', 'Noriker', 'Fjordpferd'],
    a: 0,
    explain: 'Zu den Vollblütern zählen das Englische Vollblut und der Araber (Vollblutaraber). Sie prägen als Veredler viele Warmblutzuchten.'
  },
  {
    id: 'ra07', cat: 'rassen', level: 'basis', type: 'text',
    q: 'Wie nennt man ein Pferd, dessen Fell komplett schwarz ist – inklusive Mähne, Schweif und Beinen?',
    a: ['Rappe'],
    explain: 'Beim Rappen sind Deckhaar und Langhaar schwarz. Sonnengebleichte Rappen nennt man Sommerrappen.'
  },
  {
    id: 'ra08', cat: 'rassen', level: 'profi', type: 'single',
    q: 'Was kennzeichnet einen Falben?',
    options: [
      'Fahlfarbenes Deckhaar mit dunklem Langhaar und häufig Aalstrich',
      'Rotbraunes Deckhaar mit hellem Langhaar',
      'Weiße Grundfarbe mit farbigen Platten',
      'Dunkles Deckhaar mit eingesprenkelten weißen Haaren'
    ],
    a: 0,
    explain: 'Falben tragen Wildfarbabzeichen: Aalstrich über den Rücken, oft Zebrastreifen an den Beinen und dunkles Langhaar. Typisch z. B. beim Fjordpferd.'
  },
  {
    id: 'ra09', cat: 'rassen', level: 'aufbau', type: 'multi',
    q: 'Welche Merkmale werden im Pferdepass zur Identifikation eingetragen?',
    options: ['Abzeichen an Kopf und Beinen', 'Haarwirbel', 'Farbe', 'Lieblingsfutter', 'Lebensnummer / Transponder'],
    a: [0, 1, 2, 4],
    explain: 'Der Equidenpass enthält das Signalement (Farbe, Abzeichen, Wirbel), die Lebensnummer, den Transpondercode sowie den Eintrag zur Schlachttier-Eigenschaft und die Impfungen.'
  },
  {
    id: 'ra10', cat: 'rassen', level: 'aufbau', type: 'single',
    q: 'Wie nennt man ein weißes Abzeichen, das vom Huf bis über das Fesselgelenk reicht?',
    options: ['Weiße Fessel', 'Krone', 'Halbe Röhre', 'Stern'],
    a: 0,
    explain: 'Von unten nach oben: Krone (nur Kronrand), Halbfessel, Fessel, halbe Röhre, ganze Röhre / „hoch weiß".'
  },
  {
    id: 'ra11', cat: 'rassen', level: 'profi', type: 'truefalse',
    q: 'Das Stockmaß wird am aufrecht stehenden Pferd senkrecht vom Boden bis zum höchsten Punkt des Widerristes gemessen.',
    a: true,
    explain: 'Gemessen wird auf ebenem, festem Boden mit dem Messstab, das Pferd steht geschlossen und mit natürlicher Kopfhaltung.'
  },
  {
    id: 'ra12', cat: 'rassen', level: 'profi', type: 'single',
    q: 'Welche Rasse ist ein typisches Kaltblut?',
    options: ['Rheinisch-Deutsches Kaltblut', 'Trakehner', 'Vollblutaraber', 'Welsh Pony'],
    a: 0,
    explain: 'Kaltblüter (z. B. Rheinisch-Deutsches Kaltblut, Süddeutsches Kaltblut, Noriker, Shire) sind schwere, ruhige Zugpferde mit kräftigem Fundament.'
  },
  {
    id: 'ra13', cat: 'rassen', level: 'basis', type: 'single',
    q: 'Wie wird ein kastrierter männlicher Hengst bezeichnet?',
    options: ['Wallach', 'Fohlen', 'Jährling', 'Remonte'],
    a: 0,
    explain: 'Wallach = kastrierter Hengst. Jährling = einjähriges Pferd, Absetzer = abgesetztes Fohlen, Remonte = junges Pferd in der Grundausbildung.'
  },
  {
    id: 'ra14', cat: 'rassen', level: 'aufbau', type: 'text',
    q: 'Wie heißt ein Pferd mit großflächig weiß-farbig geteiltem Fell (z. B. Tobiano)?',
    a: ['Schecke', 'Scheck'],
    explain: 'Schecken tragen große weiße Platten. Bekannte Zeichnungsmuster sind Tobiano, Overo und Tovero.'
  },
  {
    id: 'ra15', cat: 'rassen', level: 'profi', type: 'match',
    q: 'Ordne jeder Rasse ihren Typ zu.',
    pairs: [
      ['Haflinger', 'Kleinpferd'],
      ['Hannoveraner', 'Warmblut'],
      ['Noriker', 'Kaltblut'],
      ['Englisches Vollblut', 'Vollblut']
    ],
    explain: 'Der Haflinger gilt mit einem Stockmaß um 145–155 cm als Kleinpferd bzw. Pony-/Kleinpferderasse und stammt aus Südtirol.'
  },

  /* --------------------------------------------------------- HALTUNG */
  {
    id: 'ha01', cat: 'haltung', level: 'basis', type: 'multi',
    q: 'Welche Grundbedürfnisse muss eine pferdegerechte Haltung erfüllen?',
    options: [
      'Täglicher Sozialkontakt zu Artgenossen',
      'Ausreichend freie Bewegung',
      'Ständiger Zugang zu Raufutter bzw. mehrere Raufuttergaben',
      'Ganzjährige Einzelhaltung in der Box',
      'Frisches Wasser jederzeit'
    ],
    a: [0, 1, 2, 4],
    explain: 'Pferde sind Herden-, Lauf- und Dauerfresstiere. Licht, Luft, Bewegung, Sozialkontakt, Raufutter und Wasser sind die Basis jeder tiergerechten Haltung.'
  },
  {
    id: 'ha02', cat: 'haltung', level: 'aufbau', type: 'single',
    q: 'Wie berechnet man die empfohlene Mindestgröße einer Einzelbox?',
    options: [
      '(2 × Stockmaß)²',
      '2 × Stockmaß',
      'Stockmaß × 3',
      '(Stockmaß + 1 m)²'
    ],
    a: 0,
    explain: 'Faustregel: (2 × Stockmaß)². Bei 1,70 m Stockmaß also (3,40 m)² ≈ 11,6 m². Die Box muss dem Pferd ungehindertes Abliegen und Aufstehen erlauben.'
  },
  {
    id: 'ha03', cat: 'haltung', level: 'aufbau', type: 'truefalse',
    q: 'Zugluft im Stall ist unproblematisch, solange der Stall gut gelüftet ist.',
    a: false,
    explain: 'Frischluft ja – Zugluft nein. Zugluft begünstigt Erkältungen und Muskelverspannungen. Ziel ist ein gleichmäßiger Luftaustausch ohne direkten Luftzug auf das Pferd.'
  },
  {
    id: 'ha04', cat: 'haltung', level: 'basis', type: 'single',
    q: 'Woran erkennt man ein schlechtes Stallklima am deutlichsten?',
    options: [
      'Stechender Ammoniakgeruch',
      'Kühle Temperatur',
      'Heller Lichteinfall',
      'Trockene Einstreu'
    ],
    a: 0,
    explain: 'Ammoniak entsteht aus Harn und feuchter Einstreu. Er reizt die Atemwege stark. Abhilfe: regelmäßiges Misten, saugfähige Einstreu, gute Lüftung.'
  },
  {
    id: 'ha05', cat: 'haltung', level: 'basis', type: 'multi',
    q: 'Welche Einstreuarten sind in der Pferdehaltung gebräuchlich?',
    options: ['Stroh', 'Sägespäne', 'Strohpellets', 'Rindenmulch aus dem Garten', 'Leinstroh'],
    a: [0, 1, 2, 4],
    explain: 'Stroh, Späne, Strohpellets, Leinstroh und Miscanthus sind übliche Einstreu. Rindenmulch ist ungeeignet (Schimmel- und Giftpflanzenrisiko).'
  },
  {
    id: 'ha06', cat: 'haltung', level: 'aufbau', type: 'single',
    q: 'Was ist beim Anweiden im Frühjahr zu beachten?',
    options: [
      'Langsam steigern, in den ersten Tagen nur wenige Minuten Weidegang',
      'Sofort ganztägig, damit sich das Pferd schnell gewöhnt',
      'Nur nachts weiden, tagsüber gar nicht',
      'Vorher komplett auf Heu verzichten'
    ],
    a: 0,
    explain: 'Die Darmflora braucht 2–3 Wochen zur Umstellung. Man beginnt mit 10–15 Minuten und steigert täglich. Vorher Heu füttern, damit das Pferd nicht gierig frisst – sonst drohen Kolik und Hufrehe.'
  },
  {
    id: 'ha07', cat: 'haltung', level: 'aufbau', type: 'multi',
    q: 'Welche Pflanzen sind für Pferde giftig?',
    options: ['Eibe', 'Jakobskreuzkraut', 'Herbstzeitlose', 'Löwenzahn', 'Robinie'],
    a: [0, 1, 2, 4],
    explain: 'Hochgiftig sind u. a. Eibe, Jakobskreuzkraut, Herbstzeitlose, Robinie, Fingerhut, Goldregen, Bergahorn-Samen (atypische Weidemyopathie). Löwenzahn ist unbedenklich.'
  },
  {
    id: 'ha08', cat: 'haltung', level: 'basis', type: 'truefalse',
    q: 'Auch bei Offenstallhaltung muss ein trockener, windgeschützter Unterstand vorhanden sein.',
    a: true,
    explain: 'Ein Witterungsschutz ist Pflicht. Er muss so groß sein, dass alle Pferde gleichzeitig Schutz finden und rangniedere Tiere ausweichen können (mehrere Ein-/Ausgänge).'
  },
  {
    id: 'ha09', cat: 'haltung', level: 'profi', type: 'single',
    q: 'Warum sollten Weidezäune keine Stacheldrahtzäune sein?',
    options: [
      'Hohe Verletzungsgefahr – Pferde erkennen den Draht schlecht und verletzen sich schwer',
      'Stacheldraht rostet zu schnell',
      'Stacheldraht leitet keinen Strom',
      'Stacheldraht ist zu teuer'
    ],
    a: 0,
    explain: 'Empfohlen sind gut sichtbare Elektrobänder, Holz- oder Kunststoffzäune, mindestens ca. 1,20–1,50 m hoch und ohne verletzungsträchtige Kanten.'
  },
  {
    id: 'ha10', cat: 'haltung', level: 'aufbau', type: 'multi',
    q: 'Welche Aufgaben gehören zur täglichen Stallroutine?',
    options: [
      'Boxen misten und einstreuen',
      'Tränken auf Funktion prüfen und reinigen',
      'Futter- und Wasserqualität kontrollieren',
      'Pferde auf Verletzungen und Allgemeinbefinden kontrollieren',
      'Sattel jeden Tag neu anpassen lassen'
    ],
    a: [0, 1, 2, 3],
    explain: 'Der Sattel wird regelmäßig, aber nicht täglich vom Fachmann kontrolliert – etwa 1–2 mal jährlich und bei jeder deutlichen Veränderung des Pferdes.'
  },
  {
    id: 'ha11', cat: 'haltung', level: 'profi', type: 'single',
    q: 'Was versteht man unter „Integration" in der Gruppenhaltung?',
    options: [
      'Das schrittweise Eingliedern eines neuen Pferdes in eine bestehende Herde',
      'Das Zusammenlegen zweier Ställe',
      'Die Fütterung aller Pferde an einem Platz',
      'Die Eingewöhnung an den Reiter'
    ],
    a: 0,
    explain: 'Neue Pferde werden über Sichtkontakt und einen ruhigen Partner schrittweise eingegliedert. Ausreichend Platz und mehrere Fress- und Ausweichmöglichkeiten senken das Verletzungsrisiko.'
  },
  {
    id: 'ha12', cat: 'haltung', level: 'aufbau', type: 'text',
    q: 'Wie nennt man eine Haltungsform, bei der die Pferde sich frei zwischen Liegehalle, Fressplatz und Auslauf bewegen können?',
    a: ['Offenstall', 'Laufstall', 'Aktivstall', 'Bewegungsstall'],
    explain: 'Offen-, Lauf- oder Aktivstall (Bewegungsstall) fördern Bewegung und Sozialkontakt. Wichtig sind mehrere Fressplätze und großzügige Wege.'
  },
  {
    id: 'ha13', cat: 'haltung', level: 'basis', type: 'single',
    q: 'Wie oft sollte ein Pferd mindestens Zugang zu frischem Wasser haben?',
    options: ['Ständig', 'Zweimal täglich', 'Nur nach der Arbeit', 'Einmal täglich'],
    a: 0,
    explain: 'Wasser muss ständig verfügbar sein. Ein Pferd trinkt je nach Größe, Futter und Wetter etwa 30–50 Liter pro Tag, bei Hitze und Arbeit deutlich mehr.'
  },
  {
    id: 'ha14', cat: 'haltung', level: 'profi', type: 'truefalse',
    q: 'Die Weide sollte regelmäßig abgeäppelt und gepflegt werden, um den Wurmdruck zu senken.',
    a: true,
    explain: 'Abäppeln (idealerweise 1–2 × pro Woche), Nachmähen der Geilstellen, Nachsaat und Weidewechsel reduzieren Parasitenbelastung und verbessern die Grasnarbe.'
  },
  {
    id: 'ha15', cat: 'haltung', level: 'aufbau', type: 'single',
    q: 'Ein Pferd steht ganztägig in der Box und wird nur kurz geritten. Welche Folge ist typisch?',
    options: [
      'Bewegungsmangel mit Verhaltensstörungen und Gesundheitsproblemen',
      'Besonders gute Kondition',
      'Robustere Hufe',
      'Weniger Kolikgefahr'
    ],
    a: 0,
    explain: 'Bewegungsmangel begünstigt Stereotypien (Weben, Koppen), Kreislauf- und Verdauungsprobleme, angelaufene Beine und Muskelverspannungen.'
  },

  /* ------------------------------------------------------ FÜTTERUNG */
  {
    id: 'fu01', cat: 'fuetterung', level: 'basis', type: 'single',
    q: 'Wie viel Heu (Raufutter) sollte ein Pferd mindestens pro 100 kg Körpergewicht und Tag bekommen?',
    options: ['1,5 kg', '0,5 kg', '3,5 kg', '5 kg'],
    a: 0,
    explain: 'Mindestens 1,5 kg Heu je 100 kg Körpergewicht – bei einem 600-kg-Pferd also mindestens 9 kg pro Tag. Besser sind 2 kg/100 kg, verteilt auf mehrere Portionen.'
  },
  {
    id: 'fu02', cat: 'fuetterung', level: 'basis', type: 'truefalse',
    q: 'Kraftfutter wird vor dem Raufutter gefüttert.',
    a: false,
    explain: 'Erst Raufutter, dann Kraftfutter. Das Heu regt den Speichelfluss an und sorgt dafür, dass das Kraftfutter langsamer und gründlicher gekaut wird.'
  },
  {
    id: 'fu03', cat: 'fuetterung', level: 'aufbau', type: 'multi',
    q: 'Welche Fütterungsregeln sind richtig?',
    options: [
      'Lieber mehrere kleine Mahlzeiten als wenige große',
      'Futterumstellungen langsam über mehrere Tage',
      'Nach dem Kraftfutter mindestens eine Stunde Ruhe vor der Arbeit',
      'Immer zur gleichen Zeit füttern',
      'Verschimmeltes Heu ist nach dem Ausschütteln unbedenklich'
    ],
    a: [0, 1, 2, 3],
    explain: 'Schimmeliges oder staubiges Futter darf nie verfüttert werden – es verursacht Koliken und Atemwegserkrankungen.'
  },
  {
    id: 'fu04', cat: 'fuetterung', level: 'aufbau', type: 'match',
    q: 'Ordne die Futtermittel der richtigen Gruppe zu.',
    pairs: [
      ['Heu', 'Raufutter'],
      ['Hafer', 'Kraftfutter'],
      ['Möhren', 'Saftfutter'],
      ['Mineralpulver', 'Ergänzungsfutter']
    ],
    explain: 'Raufutter: Heu, Stroh, Heulage. Saftfutter: Gras, Silage, Rüben, Obst und Gemüse. Kraftfutter: Hafer, Gerste, Mais, Müsli, Pellets.'
  },
  {
    id: 'fu05', cat: 'fuetterung', level: 'basis', type: 'single',
    q: 'Welches Getreide gilt als das klassische und bekömmlichste Kraftfutter für Pferde?',
    options: ['Hafer', 'Weizen', 'Roggen', 'Reis'],
    a: 0,
    explain: 'Hafer hat eine gut verdauliche Stärke und lockere Spelzen. Gerste und Mais müssen aufbereitet (gequetscht, gepoppt) werden. Weizen und Roggen sind ungeeignet.'
  },
  {
    id: 'fu06', cat: 'fuetterung', level: 'aufbau', type: 'multi',
    q: 'Woran erkennt man gutes Heu?',
    options: [
      'Angenehm aromatischer Geruch',
      'Grünlich bis hellbraune Farbe',
      'Staubfrei und ohne Schimmelnester',
      'Muffiger Geruch und Staubwolken beim Schütteln',
      'Frei von Giftpflanzen'
    ],
    a: [0, 1, 2, 4],
    explain: 'Gutes Heu riecht aromatisch, ist trocken, staubarm, ohne Schimmel und ohne giftige Pflanzen. Heu sollte vor dem Verfüttern mindestens 6–8 Wochen abgelagert sein.'
  },
  {
    id: 'fu07', cat: 'fuetterung', level: 'profi', type: 'number',
    q: 'Wie viele Liter Wasser trinkt ein durchschnittliches Großpferd in Ruhe etwa pro Tag?',
    a: 40, tol: 15, unit: 'Liter',
    explain: 'Etwa 30–50 Liter täglich – bei Hitze, Arbeit oder trockenem Futter (Heu) deutlich mehr, auf der saftigen Weide entsprechend weniger.'
  },
  {
    id: 'fu08', cat: 'fuetterung', level: 'aufbau', type: 'truefalse',
    q: 'Ein erhitztes, verschwitztes Pferd darf sofort große Mengen eiskaltes Wasser trinken.',
    a: false,
    explain: 'Große Mengen kaltes Wasser direkt nach der Arbeit können Kolik und Muskelprobleme auslösen. Erst abkühlen lassen, dann in Ruhe trinken lassen bzw. lauwarmes Wasser anbieten.'
  },
  {
    id: 'fu09', cat: 'fuetterung', level: 'profi', type: 'single',
    q: 'Warum sollte man pro Kraftfuttermahlzeit keine zu großen Mengen füttern?',
    options: [
      'Der Magen ist klein; unverdaute Stärke gelangt sonst in den Dickdarm und stört die Darmflora',
      'Weil Kraftfutter zu teuer ist',
      'Weil das Pferd sonst nicht mehr säuft',
      'Weil sonst der Zahnabrieb zu stark ist'
    ],
    a: 0,
    explain: 'Der Pferdemagen fasst nur ca. 8–15 Liter. Große Stärkemengen überfordern die Dünndarmverdauung – Folge: Gärung im Dickdarm, Kolik, Hufrehe. Faustregel: max. rund 0,3–0,5 kg Kraftfutter je 100 kg Körpergewicht pro Mahlzeit.'
  },
  {
    id: 'fu10', cat: 'fuetterung', level: 'basis', type: 'text',
    q: 'Welches Mineral wird Pferden häufig als Leckstein frei zur Verfügung gestellt?',
    a: ['Salz', 'Kochsalz', 'Natriumchlorid'],
    explain: 'Ein Salzleckstein deckt den Natrium- und Chloridbedarf, besonders bei schwitzenden Pferden. Zusätzlich braucht es ein bedarfsgerechtes Mineralfutter.'
  },
  {
    id: 'fu11', cat: 'fuetterung', level: 'profi', type: 'order',
    q: 'Bringe die Stationen der Verdauung in die richtige Reihenfolge.',
    items: ['Maul', 'Speiseröhre', 'Magen', 'Dünndarm', 'Dickdarm', 'Mastdarm'],
    explain: 'Im Maul wird zerkleinert und eingespeichelt, im Magen vorverdaut, im Dünndarm werden Stärke, Eiweiß und Fett aufgeschlossen, im Dickdarm die Rohfaser mikrobiell abgebaut.'
  },
  {
    id: 'fu12', cat: 'fuetterung', level: 'aufbau', type: 'single',
    q: 'Wofür ist Stroh in der Fütterung besonders wertvoll?',
    options: [
      'Als strukturreiches Beschäftigungs- und Rohfaserfutter',
      'Als Hauptenergielieferant',
      'Als Eiweißquelle',
      'Als Mineralstoffquelle'
    ],
    a: 0,
    explain: 'Stroh ist energiearm, aber rohfaserreich und verlängert die Fresszeit. Es darf jedoch nur sauberes, staubfreies Stroh sein und ersetzt kein Heu.'
  },
  {
    id: 'fu13', cat: 'fuetterung', level: 'aufbau', type: 'multi',
    q: 'Welche Folgen kann dauerhafte Überfütterung mit Kraftfutter haben?',
    options: ['Übergewicht', 'Kolik', 'Hufrehe', 'Stoffwechselprobleme', 'Bessere Rittigkeit'],
    a: [0, 1, 2, 3],
    explain: 'Zu viel Energie führt zu Verfettung, Stoffwechselerkrankungen (EMS), Koliken und Hufrehe – und häufig zu übermütigem, schwer kontrollierbarem Verhalten.'
  },
  {
    id: 'fu14', cat: 'fuetterung', level: 'profi', type: 'truefalse',
    q: 'Heulage muss nach dem Öffnen des Ballens zügig verfüttert werden.',
    a: true,
    explain: 'Angeschnittene Heulage verdirbt durch Luftzutritt schnell. Sie sollte innerhalb weniger Tage aufgebraucht werden; beschädigte Ballen sind nicht verfütterbar (Botulismusgefahr).'
  },
  {
    id: 'fu15', cat: 'fuetterung', level: 'basis', type: 'single',
    q: 'Wie viele Stunden pro Tag frisst ein Pferd unter naturnahen Bedingungen?',
    options: ['12–16 Stunden', '2–3 Stunden', '5–6 Stunden', '20–22 Stunden'],
    a: 0,
    explain: 'Pferde sind Dauerfresser und nehmen über 12–16 Stunden verteilt Nahrung auf. Fresspausen von mehr als vier Stunden sollten vermieden werden (Magengeschwüre).'
  }
];
