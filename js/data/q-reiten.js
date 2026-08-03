// Fragenpool: Ausrüstung & Sattelkunde, Reitlehre & Hilfen, Bahnregeln & Hufschlagfiguren

export default [

  /* ----------------------------------------------------- AUSRÜSTUNG */
  {
    id: 'au01', cat: 'ausruestung', level: 'basis', type: 'multi',
    q: 'Aus welchen Teilen besteht eine einfache Trense (Wassertrense)?',
    options: ['Genickstück', 'Backenstücke', 'Nasenriemen', 'Stirnriemen und Kehlriemen', 'Kinnkette'],
    a: [0, 1, 2, 3],
    explain: 'Dazu kommen Gebiss und Zügel. Eine Kinnkette gehört zur Kandare, nicht zur Wassertrense.'
  },
  {
    id: 'au02', cat: 'ausruestung', level: 'basis', type: 'single',
    q: 'Wie weit sollte der Kehlriemen verschnallt sein?',
    options: [
      'Etwa eine Handbreit Platz zwischen Riemen und Ganasche',
      'Straff anliegend',
      'So weit, dass er auf dem Hals hängt',
      'Genau zwei Finger'
    ],
    a: 0,
    explain: 'Kehlriemen: eine Faust/Handbreit. Nasenriemen: etwa zwei Finger. Das Pferd muss kauen und schlucken können.'
  },
  {
    id: 'au03', cat: 'ausruestung', level: 'aufbau', type: 'single',
    q: 'Woran erkennt man, dass das Gebiss in der richtigen Höhe liegt?',
    options: [
      'Es bildet ein bis zwei leichte Falten im Maulwinkel',
      'Es hängt locker auf den Zähnen',
      'Es zieht den Maulwinkel weit nach oben',
      'Es liegt auf der Zunge auf und berührt die Maulwinkel nicht'
    ],
    a: 0,
    explain: 'Zu tief verschnallt schlägt das Gebiss gegen die Zähne, zu hoch verursacht es Druck und Falten. Auch die Gebissbreite muss passen (ca. 0,5 cm Überstand je Seite).'
  },
  {
    id: 'au04', cat: 'ausruestung', level: 'aufbau', type: 'multi',
    q: 'Welche Merkmale zeigen, dass ein Sattel passt?',
    options: [
      'Der Widerrist bleibt frei (auch mit Reiter)',
      'Die Wirbelsäule ist über die gesamte Länge frei (Kammer/Wirbelsäulenkanal)',
      'Der Sattel liegt gleichmäßig auf, ohne zu drücken oder zu schaukeln',
      'Der Sattel liegt hinter der Schulter und behindert diese nicht',
      'Der Sattel liegt möglichst weit vorne auf der Schulter'
    ],
    a: [0, 1, 2, 3],
    explain: 'Ein zu weit vorn liegender Sattel behindert die Schulterfreiheit. Weiße Haare, Druckstellen, trockene Stellen im Schweißbild oder Widersetzlichkeit sind Warnzeichen.'
  },
  {
    id: 'au05', cat: 'ausruestung', level: 'basis', type: 'order',
    q: 'Bringe die Schritte beim Satteln in die richtige Reihenfolge.',
    items: [
      'Sattellage kontrollieren und putzen',
      'Schabracke/Satteldecke auflegen',
      'Sattel behutsam auflegen',
      'Decke in die Sattelkammer hochziehen',
      'Gurt locker anziehen und später schrittweise nachgurten'
    ],
    explain: 'Der Sattel wird von links aufgelegt, nie in die Sattellage geworfen. Nachgurten erfolgt schrittweise – erstmals vor dem Aufsitzen, dann nach einigen Minuten Schritt.'
  },
  {
    id: 'au06', cat: 'ausruestung', level: 'aufbau', type: 'match',
    q: 'Ordne jeden Ausrüstungsgegenstand seiner Funktion zu.',
    pairs: [
      ['Martingal', 'Verhindert zu hohes Aufwerfen des Kopfes'],
      ['Ausbinder', 'Hilfszügel beim Longieren'],
      ['Gamaschen', 'Schutz der Beine vor Schlägen'],
      ['Abschwitzdecke', 'Trocknen des verschwitzten Pferdes']
    ],
    explain: 'Hilfszügel dürfen nie als Ersatz für korrekte Ausbildung dienen und gehören ausschließlich in erfahrene Hände.'
  },
  {
    id: 'au07', cat: 'ausruestung', level: 'profi', type: 'multi',
    q: 'Was gehört zu einer korrekt verschnallten Kandarenzäumung?',
    options: ['Unterlegtrense', 'Stangengebiss', 'Kinnkette', 'Zwei Zügelpaare', 'Sperrriemen'],
    a: [0, 1, 2, 3],
    explain: 'Die Kandare besteht aus Unterlegtrense und Stangengebiss mit Kinnkette und wird mit zwei Zügelpaaren geritten. Die Kinnkette soll bei ca. 45° Anzug greifen.'
  },
  {
    id: 'au08', cat: 'ausruestung', level: 'basis', type: 'single',
    q: 'Wie lang sollten die Steigbügelriemen beim Dressurreiten grob eingestellt sein?',
    options: [
      'Die Bügelsohle reicht etwa bis zum Knöchel des ausgestreckten Beins',
      'Etwa bis zur Mitte des Unterschenkels',
      'So kurz wie beim Springen',
      'So lang, dass die Zehenspitze gerade noch hineinkommt'
    ],
    a: 0,
    explain: 'Faustregel: Bügel bis Knöchelhöhe des locker herabhängenden Beins. Beim Springen und Geländereiten werden die Bügel deutlich kürzer geschnallt.'
  },
  {
    id: 'au09', cat: 'ausruestung', level: 'aufbau', type: 'truefalse',
    q: 'Lederzeug sollte nach jedem Gebrauch grob gereinigt und regelmäßig gefettet oder gepflegt werden.',
    a: true,
    explain: 'Schweiß und Sand greifen Leder und Nähte an. Regelmäßige Kontrolle von Nähten, Schnallen, Steigbügelriemen und Gurtstrippen ist ein Sicherheitsthema.'
  },
  {
    id: 'au10', cat: 'ausruestung', level: 'profi', type: 'single',
    q: 'Welche Aufgabe hat ein Sperrriemen (Schwedischer/kombinierter Reithalfter)?',
    options: [
      'Er stabilisiert den Nasenriemen und soll das Maulaufsperren begrenzen – muss aber locker genug verschnallt sein',
      'Er hält den Sattel an Ort und Stelle',
      'Er ersetzt die Kinnkette',
      'Er verhindert das Kauen vollständig'
    ],
    a: 0,
    explain: 'Zu fest verschnallte Nasen- und Sperrriemen sind tierschutzrelevant. Zwei Finger Platz sind Pflicht – ein Pferd muss kauen und abkauen können.'
  },

  /* ------------------------------------------------------- REITLEHRE */
  {
    id: 'rl01', cat: 'reitlehre', level: 'aufbau', type: 'order',
    q: 'Bringe die Punkte der Skala der Ausbildung in die richtige Reihenfolge.',
    items: ['Takt', 'Losgelassenheit', 'Anlehnung', 'Schwung', 'Geraderichtung', 'Versammlung'],
    explain: 'Die ersten drei Punkte bilden die Gewöhnungsphase, Schwung und Geraderichtung die Entwicklung der Schubkraft, die Versammlung die Tragkraft.'
  },
  {
    id: 'rl02', cat: 'reitlehre', level: 'basis', type: 'match',
    q: 'Ordne jeder Gangart den richtigen Takt zu.',
    pairs: [
      ['Schritt', 'Viertakt'],
      ['Trab', 'Zweitakt'],
      ['Galopp', 'Dreitakt']
    ],
    explain: 'Der Schritt ist die einzige Gangart ohne Schwebephase. Trab und Galopp haben eine Schwebephase; im Galopp folgt nach dem dritten Takt der Schwebemoment.'
  },
  {
    id: 'rl03', cat: 'reitlehre', level: 'basis', type: 'multi',
    q: 'Welche Hilfen gehören zu den Einwirkungsmöglichkeiten des Reiters?',
    options: ['Gewichtshilfen', 'Schenkelhilfen', 'Zügelhilfen', 'Stimme', 'Lautes Schreien'],
    a: [0, 1, 2, 3],
    explain: 'Die drei Grundhilfen sind Gewicht, Schenkel und Zügel; unterstützend wirken Stimme, Gerte und Sporen. Hilfen wirken immer im Zusammenspiel.'
  },
  {
    id: 'rl04', cat: 'reitlehre', level: 'basis', type: 'single',
    q: 'Was beschreibt eine halbe Parade?',
    options: [
      'Eine kurze Verständigung aus Gewichts-, Schenkel- und Zügelhilfen zur Vorbereitung von Übergängen und Lektionen',
      'Das vollständige Anhalten aus dem Trab',
      'Das Verkürzen des Zügels',
      'Ein halber Zirkel'
    ],
    a: 0,
    explain: 'Die halbe Parade verbessert Aufmerksamkeit, Balance und Hankenbeugung. Die ganze Parade führt zum Halten.'
  },
  {
    id: 'rl05', cat: 'reitlehre', level: 'aufbau', type: 'single',
    q: 'Wie leichttrabt man richtig?',
    options: [
      'Beim Vortreten des äußeren Vorderbeins aufstehen',
      'Beim Vortreten des inneren Vorderbeins aufstehen',
      'Immer zwei Tritte aufstehen, einen sitzen',
      'Nur im Galopp'
    ],
    a: 0,
    explain: 'Man sitzt ein, wenn das äußere Vorderbein auffußt, und steht auf, wenn es vorschwingt. So wird das innere Hinterbein entlastet. Beim Handwechsel wird umgesessen.'
  },
  {
    id: 'rl06', cat: 'reitlehre', level: 'aufbau', type: 'multi',
    q: 'Welche Merkmale kennzeichnen einen korrekten Dressursitz?',
    options: [
      'Ohr – Schulter – Hüfte – Absatz auf einer senkrechten Linie',
      'Aufrechter Oberkörper, geschmeidiges Becken',
      'Ruhig anliegende Unterschenkel',
      'Gerade Linie von Ellbogen über Hand zum Pferdemaul',
      'Durchgedrückte Knie und feste Schultern'
    ],
    a: [0, 1, 2, 3],
    explain: 'Der ausbalancierte, geschmeidige Sitz ist Voraussetzung für feine Hilfen. Verspannungen im Knie, Rücken oder Handgelenk stören Takt und Losgelassenheit.'
  },
  {
    id: 'rl07', cat: 'reitlehre', level: 'aufbau', type: 'truefalse',
    q: 'Losgelassenheit erkennt man unter anderem an einem schwingenden Rücken, taktmäßiger Bewegung, zufriedenem Abkauen und pendelndem Schweif.',
    a: true,
    explain: 'Weitere Zeichen: gleichmäßige Atmung („Abschnauben"), zwanglose Kopf-Hals-Haltung und ein Pferd, das sich beim Zügel-aus-der-Hand-kauen-Lassen vertrauensvoll dehnt.'
  },
  {
    id: 'rl08', cat: 'reitlehre', level: 'profi', type: 'single',
    q: 'Was versteht man unter Anlehnung?',
    options: [
      'Die stete, weich-elastische Verbindung zwischen Reiterhand und Pferdemaul',
      'Das Anlehnen des Pferdes an die Bande',
      'Ein festes Ziehen am Zügel',
      'Die Stellung des Kopfes zur Seite'
    ],
    a: 0,
    explain: 'Anlehnung entsteht von hinten nach vorne: Das Pferd tritt an die Hand heran, es zieht sie nicht zu sich. Sie ist Ergebnis von Takt und Losgelassenheit – nie durch Handeinwirkung erzwungen.'
  },
  {
    id: 'rl09', cat: 'reitlehre', level: 'profi', type: 'match',
    q: 'Ordne die Lektionen ihrer Beschreibung zu.',
    pairs: [
      ['Schenkelweichen', 'Lösende Seitengangartige Übung mit nur leichter Stellung'],
      ['Schulterherein', 'Auf drei Hufschlagen, Pferd um den inneren Schenkel gebogen'],
      ['Travers', 'Kruppenherein mit Stellung und Biegung zur Bewegungsrichtung'],
      ['Kurzkehrtwendung', 'Wendung um die Hinterhand im Schritt']
    ],
    explain: 'Schenkelweichen ist eine Gehorsams- und Lösungsübung ohne Längsbiegung; Schulterherein, Travers, Renvers und Traversale sind versammelnde Seitengänge.'
  },
  {
    id: 'rl10', cat: 'reitlehre', level: 'aufbau', type: 'single',
    q: 'Womit beginnt jede Reitstunde bzw. Trainingseinheit?',
    options: [
      'Mit einer Lösungsphase, z. B. mindestens 10–15 Minuten Schritt am langen Zügel',
      'Sofort mit Galopparbeit',
      'Mit versammelnden Lektionen',
      'Mit Springen'
    ],
    a: 0,
    explain: 'Aufwärmen schützt Sehnen, Bänder und Muskulatur. Nach der Arbeit folgt die Erholungsphase im Schritt, bis das Pferd trocken und die Atmung ruhig ist.'
  },
  {
    id: 'rl11', cat: 'reitlehre', level: 'basis', type: 'single',
    q: 'In welchem Tempo wird beim Springen üblicherweise geritten (Grundtempo)?',
    options: ['ca. 350 m/min', 'ca. 150 m/min', 'ca. 600 m/min', 'ca. 220 m/min'],
    a: 0,
    explain: 'Springen: rund 350 m/min. Zum Vergleich: Schritt etwa 100 m/min, Arbeitstrab rund 220 m/min.'
  },
  {
    id: 'rl12', cat: 'reitlehre', level: 'aufbau', type: 'multi',
    q: 'Welche Phasen hat ein Sprung?',
    options: ['Anritt', 'Absprung', 'Flugphase', 'Landung', 'Rückwärtsrichten'],
    a: [0, 1, 2, 3],
    explain: 'Nach der Landung folgt der Weiterritt („Abritt"). Der Reiter geht im leichten Sitz mit, die Hand folgt dem Maul über die Flugphase.'
  },
  {
    id: 'rl13', cat: 'reitlehre', level: 'profi', type: 'truefalse',
    q: 'Beim Galopp auf der rechten Hand sollte das Pferd im Rechtsgalopp springen, das heißt das rechte Vorderbein greift weiter vor.',
    a: true,
    explain: 'Im Rechtsgalopp ist die Fußfolge: linkes Hinterbein – diagonales Paar – rechtes Vorderbein, danach die Schwebephase. Falscher Galopp wird als Lektion bewusst geritten, Kreuzgalopp ist ein Fehler.'
  },
  {
    id: 'rl14', cat: 'reitlehre', level: 'basis', type: 'text',
    q: 'Wie heißt der Sitz mit vorgeneigtem Oberkörper und entlastetem Gesäß, der beim Springen und Geländereiten verwendet wird?',
    a: ['Leichter Sitz', 'Entlastungssitz'],
    explain: 'Beim leichten Sitz federt der Reiter in Knie- und Sprunggelenken ab und entlastet den Pferderücken. Beim Dressursitz ist das Gesäß im Sattel.'
  },
  {
    id: 'rl15', cat: 'reitlehre', level: 'profi', type: 'single',
    q: 'Was bedeutet „Geraderichten"?',
    options: [
      'Vorhand und Hinterhand auf einer Linie – das Pferd tritt mit den Hinterbeinen in die Spur der Vorderbeine',
      'Das Pferd immer nur geradeaus zu reiten',
      'Den Hals gerade nach vorn zu stellen',
      'Die Zügel gleich lang zu halten'
    ],
    a: 0,
    explain: 'Jedes Pferd ist von Natur aus schief. Geraderichten (u. a. über Schulterherein, Zirkel, Konterlektionen) sorgt für gleichmäßige Belastung und ist Voraussetzung für Versammlung.'
  },

  /* ------------------------------------------ BAHNREGELN & FIGUREN */
  {
    id: 'ba01', cat: 'bahn', level: 'basis', type: 'single',
    q: 'Welchen Ruf verwendet man, bevor man die Reitbahn betritt oder verlässt?',
    options: ['„Tür frei!"', '„Achtung!"', '„Bahn frei!"', '„Halt!"'],
    a: 0,
    explain: 'Erst „Tür frei!" rufen, Antwort abwarten, dann zügig eintreten oder hinausgehen. In der Bahn wird abseits des Hufschlags aufgestiegen.'
  },
  {
    id: 'ba02', cat: 'bahn', level: 'basis', type: 'single',
    q: 'Zwei Reiter begegnen sich auf dem Hufschlag. Wer bleibt am Hufschlag?',
    options: [
      'Der Reiter auf der linken Hand',
      'Der Reiter auf der rechten Hand',
      'Der schnellere Reiter',
      'Der ältere Reiter'
    ],
    a: 0,
    explain: 'Beim Begegnen wird links an links ausgewichen. Der Reiter auf der linken Hand behält den ersten Hufschlag, der andere weicht nach innen aus.'
  },
  {
    id: 'ba03', cat: 'bahn', level: 'aufbau', type: 'multi',
    q: 'Welche Bahnregeln sind richtig?',
    options: [
      'Ganze Bahn geht vor Zirkel',
      'Schritt reitende Paare weichen den in Trab und Galopp reitenden aus',
      'Mindestens eine Pferdelänge Abstand halten',
      'Beim Halten den ersten Hufschlag freimachen',
      'Beim Longieren darf ohne Absprache in der vollen Bahn longiert werden'
    ],
    a: [0, 1, 2, 3],
    explain: 'Longieren in der Bahn nur nach Absprache und mit ausreichend Platz. Wer stärkere Gangarten reitet, hat Vorrang auf dem ersten Hufschlag.'
  },
  {
    id: 'ba04', cat: 'bahn', level: 'aufbau', type: 'single',
    q: 'Wie groß ist ein Zirkel in einer 20 × 40 m Bahn?',
    options: ['20 m Durchmesser', '10 m Durchmesser', '15 m Durchmesser', '30 m Durchmesser'],
    a: 0,
    explain: 'Der Zirkel hat 20 m Durchmesser, also die Breite der Bahn. Volten sind mit 6, 8 oder 10 m deutlich kleiner.'
  },
  {
    id: 'ba05', cat: 'bahn', level: 'aufbau', type: 'order',
    q: 'Nenne die Bahnpunkte der kleinen Dressurbahn (20 × 40 m) in der Reihenfolge, wie sie von A aus auf der rechten Hand durchlaufen werden.',
    items: ['A', 'K', 'E', 'H', 'C', 'M', 'B', 'F'],
    explain: 'Große Bahn (20 × 60 m): A – K – V – E – S – H – C – M – R – B – P – F. Merksatz für die Ecken: „Alle Kinder Haben Chips Mit Fett".'
  },
  {
    id: 'ba06', cat: 'bahn', level: 'basis', type: 'single',
    q: 'Wo liegt der Bahnpunkt X?',
    options: [
      'In der Mitte der Bahn',
      'Am Ende der langen Seite',
      'Bei der Einfahrt',
      'In der Ecke'
    ],
    a: 0,
    explain: 'X ist der Mittelpunkt der Bahn (Schnittpunkt von Mittellinie und Mittelzirkellinie). Weitere innere Punkte der großen Bahn sind D, L, X, I und G.'
  },
  {
    id: 'ba07', cat: 'bahn', level: 'aufbau', type: 'match',
    q: 'Ordne die Hufschlagfiguren ihrer Beschreibung zu.',
    pairs: [
      ['Volte', 'Kleiner Kreis mit 6, 8 oder 10 m Durchmesser'],
      ['Durch die ganze Bahn wechseln', 'Diagonaler Handwechsel von Ecke zu Ecke'],
      ['Durch den Zirkel wechseln', 'Zwei halbe Zirkel mit Handwechsel in der Mitte'],
      ['Schlangenlinie', 'Bögen entlang der Bahn mit Wechsel der Biegung']
    ],
    explain: 'Weitere Figuren: aus dem Zirkel wechseln, durch die Länge der Bahn wechseln, Achtfigur, aus der Ecke kehrt, Mittellinie.'
  },
  {
    id: 'ba08', cat: 'bahn', level: 'profi', type: 'truefalse',
    q: 'In einer 20 × 60 m Bahn liegen die Punkte V, S, R und P jeweils zwischen den Punkten der langen Seiten.',
    a: true,
    explain: 'Die große Bahn hat die Reihenfolge A – K – V – E – S – H – C – M – R – B – P – F. V und P liegen zwischen K/E bzw. B/F, S und R zwischen E/H bzw. B/M.'
  },
  {
    id: 'ba09', cat: 'bahn', level: 'basis', type: 'single',
    q: 'Was bedeutet „auf der linken Hand reiten"?',
    options: [
      'Man reitet links herum – die linke Seite des Pferdes zeigt zur Bahnmitte',
      'Man hält die Zügel nur in der linken Hand',
      'Man reitet rechts herum',
      'Man reitet auf dem zweiten Hufschlag'
    ],
    a: 0,
    explain: 'Auf der linken Hand geht es gegen den Uhrzeigersinn; innen ist links. Handwechsel erfolgen über Diagonalen, Zirkel oder die Mittellinie.'
  },
  {
    id: 'ba10', cat: 'bahn', level: 'aufbau', type: 'single',
    q: 'Warum reitet man in der Abteilung mit ausreichendem Abstand?',
    options: [
      'Um Auffahren, Schlagen und Unfälle zu vermeiden',
      'Damit das Vorderpferd schneller wird',
      'Weil die Bahn sonst zu klein ist',
      'Damit man die Kommandos besser hört'
    ],
    a: 0,
    explain: 'Mindestens eine Pferdelänge Abstand. Vor Pferden, die nicht angeritten werden dürfen (rote Schleife im Schweif), besonders vorsichtig sein.'
  },
  {
    id: 'ba11', cat: 'bahn', level: 'profi', type: 'single',
    q: 'Was bedeutet eine rote Schleife im Schweif eines Pferdes?',
    options: [
      'Das Pferd schlägt – Abstand halten',
      'Das Pferd ist ein Jungpferd',
      'Das Pferd ist zu verkaufen',
      'Das Pferd ist ein Turniersieger'
    ],
    a: 0,
    explain: 'Rote Schleife = schlägt. Eine grüne Schleife kennzeichnet je nach Region ein junges bzw. unerfahrenes Pferd.'
  },
  {
    id: 'ba12', cat: 'bahn', level: 'aufbau', type: 'multi',
    q: 'Was ist beim Longieren oder Reiten in der Halle gemeinsam mit anderen zu beachten?',
    options: [
      'Vorher absprechen, wer welchen Bereich nutzt',
      'Andere Reiter beim Überholen ansprechen',
      'Auf der Zirkellinie nicht schneiden',
      'Beim Springen die Hindernisse ankündigen',
      'Möglichst dicht auffahren, um Platz zu sparen'
    ],
    a: [0, 1, 2, 3],
    explain: 'Kommunikation ist die wichtigste Bahnregel. Hindernisse werden nach dem Springen wieder aufgebaut bzw. abgeräumt.'
  },
  {
    id: 'ba13', cat: 'bahn', level: 'profi', type: 'text',
    q: 'Wie heißt die Hufschlagfigur, bei der man von der Mitte der kurzen Seite (z. B. A) auf gerader Linie zur gegenüberliegenden kurzen Seite (C) reitet?',
    a: ['Mittellinie', 'Durch die Länge der Bahn wechseln', 'Ganze Mittellinie'],
    explain: 'Das Reiten der Mittellinie – „Durch die Länge der Bahn wechseln" – prüft Geradeaus-Richtung und Gleichgewicht besonders deutlich.'
  },
  {
    id: 'ba14', cat: 'bahn', level: 'basis', type: 'truefalse',
    q: 'Beim Auf- und Absitzen sollte man den ersten Hufschlag freihalten.',
    a: true,
    explain: 'Auf- und Absitzen, Nachgurten oder Bügelverstellen erfolgen in der Bahnmitte oder auf dem zweiten Hufschlag, damit andere Reiter ungehindert weiterreiten können.'
  },
  {
    id: 'ba15', cat: 'bahn', level: 'aufbau', type: 'single',
    q: 'Was versteht man unter dem „ersten Hufschlag"?',
    options: [
      'Die Spur direkt an der Bande bzw. am Bahnrand',
      'Die Mittellinie',
      'Die Zirkellinie',
      'Die Spur einen Meter vor der Bande'
    ],
    a: 0,
    explain: 'Der zweite Hufschlag verläuft etwa 1–1,5 m weiter innen und wird u. a. beim Schrittreiten oder Überholen genutzt.'
  }
];
