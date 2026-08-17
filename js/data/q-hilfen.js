// SPDX-License-Identifier: Apache-2.0
// Fragenpool: Hilfengebung & Paraden
// Inhaltlich nach den Lernzielen der Lerneinheit "Reitlehre I – Hilfengebung"
// (Einwirkungen des Reiters, Paraden, diagonale Hilfengebung).

export default [
  {
    id: 'hi01', cat: 'hilfen', level: 'basis', type: 'multi',
    q: 'Welche Hilfengruppen unterscheidet man bei der Einwirkung des Reiters?',
    options: [
      'Treibende Hilfen',
      'Verhaltende Hilfen',
      'Gewichtshilfen',
      'Unterstützende Hilfen',
      'Zwingende Hilfen'
    ],
    a: [0, 1, 2, 3],
    explain: 'Treibende Hilfen sind die Schenkelhilfen, verhaltende Hilfen die Zügelhilfen. Die Gewichtshilfen sind das Bindeglied zwischen beiden Gruppen. Dazu kommen die unterstützenden Hilfen (Stimme, Gerte, Sporen).'
  },
  {
    id: 'hi02', cat: 'hilfen', level: 'basis', type: 'match',
    q: 'Ordne die Hilfen der richtigen Gruppe zu.',
    pairs: [
      ['Schenkelhilfen', 'Treibende Hilfen'],
      ['Zügelhilfen', 'Verhaltende Hilfen'],
      ['Gewichtshilfen', 'Bindeglied zwischen beiden Gruppen'],
      ['Stimme und Gerte', 'Unterstützende Hilfen']
    ],
    explain: 'Die Gewichtshilfen verbinden treibende und verhaltende Einwirkung – sie wirken bei fast jeder Hilfengebung mit.'
  },
  {
    id: 'hi03', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Warum gelten die Gewichtshilfen als die wichtigsten Hilfen?',
    options: [
      'Weil das Pferd sie immer spürt',
      'Weil sie am leichtesten zu erlernen sind',
      'Weil sie ohne Sitz funktionieren',
      'Weil sie nur im Galopp wirken'
    ],
    a: 0,
    explain: 'Der Reiter sitzt permanent auf dem Pferderücken – jede Veränderung seines Gewichts wird wahrgenommen. Deshalb wirkt der Sitz immer mit, ob gewollt oder nicht.'
  },
  {
    id: 'hi04', twin: 'gewichtshilfen-arten', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Welche Arten von Gewichtshilfen gibt es?',
    options: [
      'Beidseitig belastende Gewichtshilfe',
      'Einseitig belastende Gewichtshilfe',
      'Entlastende Gewichtshilfe',
      'Seitwärts weisende Gewichtshilfe'
    ],
    a: [0, 1, 2],
    explain: 'Beidseitig belastend (z. B. bei Übergängen und ganzen Paraden), einseitig belastend (in Biegungen) und entlastend (im Entlastungssitz, zum Lösen des Pferdes).'
  },
  {
    id: 'hi05', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Wie gibt der Reiter eine beidseitig belastende Gewichtshilfe?',
    options: [
      'Er kippt sein Becken durch kurzzeitige, elastische Anspannung von Bauch- und Rückenmuskulatur etwas nach hinten',
      'Er lehnt den Oberkörper weit zurück und stemmt sich in die Bügel',
      'Er verlagert das Gewicht auf den inneren Gesäßknochen',
      'Er geht in den leichten Sitz'
    ],
    a: 0,
    explain: 'Sie wird z. B. bei Übergängen und ganzen Paraden eingesetzt. Wichtig: kurzzeitig und elastisch – kein dauerhaftes Zurücklehnen.'
  },
  {
    id: 'hi06', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Wann setzt der Reiter die einseitig belastende Gewichtshilfe ein?',
    options: [
      'In allen Biegungen – das Gewicht kommt vermehrt auf den inneren Gesäßknochen',
      'Nur beim Halten',
      'Beim Rückwärtsrichten',
      'Nur im starken Trab'
    ],
    a: 0,
    explain: 'Zum Beispiel auf Zirkellinien, in Wendungen oder im Slalom. Der Reiter belastet den inneren Gesäßknochen etwas mehr, ohne sich seitlich zu verwerfen.'
  },
  {
    id: 'hi07', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Wozu dient die entlastende Gewichtshilfe?',
    options: [
      'Der Reiter nimmt Druck vom Pferderücken – zum Lösen und zur Entspannung',
      'Sie erhöht den Druck auf den Rücken, um mehr Schwung zu erzeugen',
      'Sie ersetzt die Zügelhilfen',
      'Sie wird nur beim Halten eingesetzt'
    ],
    a: 0,
    explain: 'Typisch im Entlastungssitz bzw. leichten Sitz – etwa in der Lösungsphase, bei jungen Pferden oder im Gelände.'
  },
  {
    id: 'hi08', twin: 'schenkelhilfen-arten', cat: 'hilfen', level: 'aufbau', type: 'match',
    q: 'Ordne jede Schenkelhilfe ihrer Lage und Aufgabe zu.',
    pairs: [
      ['Vorwärts treibender Schenkel', 'Liegt am Gurt und treibt im Rhythmus der Bewegung'],
      ['Vorwärts-seitwärts treibender Schenkel', 'Knapp eine Handbreit hinter dem Gurt, immer innen'],
      ['Verwahrender Schenkel', 'Eine Handbreit hinter dem Gurt, immer außen']
    ],
    explain: 'Der vorwärts-seitwärts treibende Schenkel veranlasst das Pferd zum seitwärts Treten (z. B. Schenkelweichen), der verwahrende Schenkel verhindert das Ausfallen der Hinterhand nach außen.'
  },
  {
    id: 'hi09', cat: 'hilfen', level: 'basis', type: 'single',
    q: 'Wo liegt der vorwärts treibende Schenkel?',
    options: ['Am Gurt', 'Eine Handbreit hinter dem Gurt', 'Vor dem Gurt an der Schulter', 'Am Bauch unter dem Sattel'],
    a: 0,
    explain: 'Er treibt im Rhythmus der Bewegung – z. B. zur Erhöhung des Tempos, beim Reiten von Übergängen und bei ganzen Paraden.'
  },
  {
    id: 'hi10', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Welche Aufgabe hat der verwahrende Schenkel?',
    options: [
      'Er verhindert das Ausfallen bzw. Wegdrängen des Pferdes nach außen',
      'Er treibt das Pferd vorwärts-seitwärts',
      'Er erhöht das Tempo',
      'Er bewirkt die Stellung im Genick'
    ],
    a: 0,
    explain: 'Er liegt immer außen, eine Handbreit hinter dem Gurt – nötig in jeder Biegung, kombiniert mit einer entsprechenden Beckenposition.'
  },
  {
    id: 'hi11', twin: 'zuegelhilfen-arten', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Welche Arten von Zügelhilfen gibt es?',
    options: [
      'Annehmende Zügelhilfe',
      'Nachgebende Zügelhilfe',
      'Verwahrende Zügelhilfe',
      'Aushaltende Zügelhilfe',
      'Seitwärts weisende Zügelhilfe',
      'Treibende Zügelhilfe'
    ],
    a: [0, 1, 2, 3, 4],
    explain: 'Zügelhilfen gehören zu den verhaltenden Hilfen – treibend wirken sie nie. Die treibenden Hilfen sollen stets über die verhaltenden dominieren.'
  },
  {
    id: 'hi12', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Wie gibt der Reiter eine annehmende Zügelhilfe?',
    options: [
      'Kurzes Schließen der Hand bis zum lockeren Eindrehen des Handgelenks',
      'Kräftiges Ziehen am inneren Zügel',
      'Vorschieben beider Hände zum Pferdemaul',
      'Anheben beider Fäuste über den Widerrist'
    ],
    a: 0,
    explain: 'Reagiert das Pferd, folgt sofort eine nachgebende Zügelhilfe. Reagiert es nicht, folgt nach dem Nachgeben erneut eine annehmende Zügelhilfe.'
  },
  {
    id: 'hi13', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Was muss auf eine annehmende Zügelhilfe folgen, sobald das Pferd reagiert?',
    options: [
      'Eine nachgebende Zügelhilfe',
      'Eine zweite annehmende Zügelhilfe',
      'Eine aushaltende Zügelhilfe',
      'Ein Gertenimpuls'
    ],
    a: 0,
    explain: 'Annehmen und Nachgeben gehören untrennbar zusammen. Beim Nachgeben sind die Handgelenke wieder gerade und die Hand locker – so bleibt die Anlehnung weich.'
  },
  {
    id: 'hi14', cat: 'hilfen', level: 'profi', type: 'single',
    q: 'Wo und wozu wirkt die verwahrende Zügelhilfe?',
    options: [
      'Immer außen – sie ergänzt den stellunggebenden inneren Zügel und begrenzt eine zu starke Stellung',
      'Immer innen – sie erzeugt die Stellung',
      'An beiden Zügeln gleichzeitig zum Anhalten',
      'Nur beim Rückwärtsrichten'
    ],
    a: 0,
    explain: 'Ohne den verwahrenden äußeren Zügel entstünde in der Biegung eine Stellung, die der Biegung nicht angemessen ist – das Pferd fällt über die äußere Schulter aus.'
  },
  {
    id: 'hi15', cat: 'hilfen', level: 'profi', type: 'single',
    q: 'Für welche Pferde ist die aushaltende Zügelhilfe gedacht?',
    options: [
      'Für gut ausgebildete, durchlässige Pferde',
      'Für Fohlen und Jungpferde',
      'Für Pferde in der Lösungsphase',
      'Für Pferde, die am Zügel ziehen'
    ],
    a: 0,
    explain: 'Die Hände bleiben für einen Moment vermehrt geschlossen, während die Schenkel vorwärts treiben – das Pferd wird dadurch vermehrt geschlossen. Bei ungeübten Pferden führt das nur zu Widerstand.'
  },
  {
    id: 'hi16', cat: 'hilfen', level: 'aufbau', type: 'single',
    q: 'Bei wem wird die seitwärts weisende Zügelhilfe vor allem eingesetzt?',
    options: [
      'Bei jungen Pferden und unerfahrenen Reitern',
      'Nur in Prüfungen ab Klasse S',
      'Bei Pferden im starken Galopp',
      'Beim Longieren'
    ],
    a: 0,
    explain: 'Die innere Zügelhand bewegt sich in Richtung der Wendung zur Seite und weist so den Weg. Mit zunehmender Ausbildung wird sie überflüssig.'
  },
  {
    id: 'hi17', cat: 'hilfen', level: 'basis', type: 'multi',
    q: 'Was gehört zu den unterstützenden Hilfen?',
    options: ['Stimme', 'Gerte', 'Sporen', 'Zügel', 'Gewicht'],
    a: [0, 1, 2],
    explain: 'Zügel-, Schenkel- und Gewichtshilfen sind die eigentlichen Hilfen. Stimme, Gerte und Sporen unterstützen sie nur.'
  },
  {
    id: 'hi18', cat: 'hilfen', level: 'basis', type: 'truefalse',
    q: 'Stimmhilfen sollten sparsam eingesetzt werden und nur für das eigene Pferd wahrnehmbar sein.',
    a: true,
    explain: 'Die Stimme kann lobend, beruhigend, aufmunternd oder tadelnd wirken. Ständiges Reden stumpft ab – und laute Kommandos stören alle anderen in der Bahn.'
  },
  {
    id: 'hi19', cat: 'hilfen', level: 'basis', type: 'single',
    q: 'Wann muss ein Lob erfolgen, damit das Pferd es versteht?',
    options: [
      'Unmittelbar nach dem gewünschten Verhalten und begründet',
      'Am Ende der Reitstunde',
      'Erst nach dem Absitzen',
      'Immer beim Betreten der Bahn'
    ],
    a: 0,
    explain: 'Zum Loben kann der Reiter die Zügel in eine Hand nehmen und mit der anderen sanft über den Hals streichen. Lob gibt dem Pferd die positive Rückmeldung, auf der jede Ausbildung aufbaut.'
  },
  {
    id: 'hi20', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Was gilt für den Einsatz der Gerte?',
    options: [
      'Sie wirkt treibend als Unterstützung des Schenkels',
      'Sie kann an der äußeren Schulter begrenzen',
      'Sie soll präzise und dosiert eingesetzt werden',
      'Ständiger Einsatz führt zur Abstumpfung',
      'Sie ersetzt die Schenkelhilfe dauerhaft'
    ],
    a: [0, 1, 2, 3],
    explain: 'Der Reiter sollte die Gerte mit beiden Händen führen können. Sie unterstützt die Schenkelhilfe, ersetzt sie aber nie.'
  },
  {
    id: 'hi21', cat: 'hilfen', level: 'profi', type: 'order',
    q: 'Bringe die Schritte des Gertenwechsels in die richtige Reihenfolge.',
    items: [
      'Beide Zügel in die Gertenhand nehmen',
      'Mit der freien Hand die Gerte nach oben herausziehen',
      'Gerte auf die neue Seite führen',
      'Den Zügel wieder in die frei gewordene Hand aufnehmen'
    ],
    explain: 'Bei langen Gerten zieht man sie zunächst nur bis zur Hälfte heraus. Der Wechsel sollte ruhig und ohne Störung der Anlehnung erfolgen.'
  },
  {
    id: 'hi22', cat: 'hilfen', level: 'aufbau', type: 'truefalse',
    q: 'Die treibenden Hilfen sollen stets über die verhaltenden Hilfen dominieren.',
    a: true,
    explain: 'Reiten geht von hinten nach vorne. Voraussetzung für das feine Zusammenwirken aller Hilfen ist ein unabhängiger, losgelassener Sitz.'
  },
  {
    id: 'hi23', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Wozu dienen halbe Paraden?',
    options: [
      'Zur Vorbereitung von Übergängen',
      'Um das Pferd aufmerksam zu machen',
      'Zur Temporeduzierung',
      'Um Takt, Form und Gleichgewicht zu erhalten oder zu verbessern',
      'Zum geschlossenen Stehen'
    ],
    a: [0, 1, 2, 3],
    explain: 'Halbe Paraden sind das wichtigste Verständigungsmittel zwischen Reiter und Pferd und können auch auf gebogenen Linien gegeben werden. Zum Halten führt die ganze Parade.'
  },
  {
    id: 'hi24', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Was gilt für ganze Paraden?',
    options: [
      'Sie bringen das Pferd zum Halten und geschlossenen Stehen',
      'Sie können aus jeder Gangart erfolgen',
      'Sie werden nur auf geraden Linien geritten',
      'Sie bestehen aus mehreren halben Paraden',
      'Sie werden bevorzugt in der Wendung geritten'
    ],
    a: [0, 1, 2, 3],
    explain: 'Weil die ganze Parade aus mehreren halben Paraden entsteht, hält das Pferd ohne Widerstand an.'
  },
  {
    id: 'hi25', cat: 'hilfen', level: 'profi', type: 'multi',
    q: 'Welche Hilfen gehören zu jeder Parade?',
    options: [
      'Belastende Gewichtshilfe',
      'Vorwärtstreibende Schenkelhilfen',
      'Annehmende bis aushaltende und wieder nachgebende Zügelhilfen',
      'Nachlassen der Schenkelhilfen'
    ],
    a: [0, 1, 2],
    explain: 'Auch beim Anhalten wird weiter getrieben – sonst fällt das Pferd auseinander und tritt nicht geschlossen unter.'
  },
  {
    id: 'hi26', cat: 'hilfen', level: 'aufbau', type: 'order',
    q: 'Bringe die Hilfen zum Anreiten im Schritt in die richtige Reihenfolge.',
    items: [
      'Vorbereitende halbe Parade',
      'Belastende bis entlastende Gewichtshilfe',
      'Vorwärtstreibende Schenkelhilfen',
      'Nachgebende Zügelhilfen'
    ],
    explain: 'Unterstützend können Stimme oder Gerte eingesetzt werden. Wichtig ist das Nachgeben der Zügelhand – sonst treibt der Reiter gegen die eigene Hand.'
  },
  {
    id: 'hi27', cat: 'hilfen', level: 'profi', type: 'single',
    q: 'Was versteht man unter diagonaler Hilfengebung?',
    options: [
      'Innere Gewichts- und Schenkelhilfe korrespondieren mit dem äußeren Zügel und umgekehrt',
      'Der Reiter wechselt die Hilfen im Rhythmus der Diagonalen',
      'Alle Hilfen werden gleichzeitig auf einer Seite gegeben',
      'Die Hilfen werden nur beim Durchreiten der Diagonale gegeben'
    ],
    a: 0,
    explain: 'Die diagonale Hilfengebung rahmt das Pferd ein und hält die zwei bis drei Meter Pferd „in Spur". Beispiel Stellen: Wird der innere Zügel angenommen, muss der äußere Schenkel verwahrend begrenzen.'
  },
  {
    id: 'hi28', cat: 'hilfen', level: 'profi', type: 'truefalse',
    q: 'Voraussetzung für das feine Zusammenwirken aller Hilfen ist ein unabhängiger, losgelassener Sitz.',
    a: true,
    explain: 'Nur wer nicht am Zügel balanciert, kann Gewicht, Schenkel und Zügel getrennt voneinander einsetzen – deshalb steht der Sitz am Anfang des Ausbildungswegs des Reiters.'
  },

  /* --- Wie viele? Zahlen und Abgrenzungen --------------------------- */
  {
    id: 'hi29', twin: 'gewichtshilfen-arten', cat: 'hilfen', level: 'aufbau', type: 'number',
    q: 'Wie viele Arten von Gewichtshilfen unterscheidet man?',
    a: 3, tol: 0, unit: 'Arten',
    explain: 'Drei: beidseitig belastend, einseitig belastend und entlastend.'
  },
  {
    id: 'hi30', twin: 'schenkelhilfen-arten', cat: 'hilfen', level: 'aufbau', type: 'number',
    q: 'Wie viele Arten von Schenkelhilfen unterscheidet man?',
    a: 3, tol: 0, unit: 'Arten',
    explain: 'Drei: vorwärts treibend (am Gurt), vorwärts-seitwärts treibend (knapp eine Handbreit hinter dem Gurt, innen) und verwahrend (eine Handbreit hinter dem Gurt, außen).'
  },
  {
    id: 'hi31', twin: 'zuegelhilfen-arten', cat: 'hilfen', level: 'profi', type: 'number',
    q: 'Wie viele Arten von Zügelhilfen unterscheidet man?',
    a: 5, tol: 0, unit: 'Arten',
    explain: 'Fünf: annehmend, nachgebend, verwahrend, aushaltend (auch durchhaltend genannt) und seitwärts weisend.'
  },
  {
    id: 'hi32', cat: 'hilfen', level: 'aufbau', type: 'text',
    q: 'Wie heißt die Zügelhilfe, die immer außen gegeben wird und den stellunggebenden inneren Zügel ergänzt?',
    a: ['verwahrende Zügelhilfe', 'verwahrend'],
    explain: 'Die verwahrende Zügelhilfe begrenzt außen. Ohne sie entsteht zu viel Stellung und das Pferd fällt über die äußere Schulter aus.'
  },
  {
    id: 'hi33', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Welche der genannten Hilfen gibt es so NICHT?',
    options: [
      'Treibende Zügelhilfe',
      'Entlastende Zügelhilfe',
      'Verwahrender Schenkel',
      'Aushaltende Zügelhilfe',
      'Seitwärts weisende Gewichtshilfe'
    ],
    a: [0, 1, 4],
    explain: 'Zügelhilfen wirken nie treibend – treiben ist Aufgabe der Schenkel. „Entlastend" gehört zu den Gewichtshilfen, „seitwärts weisend" zu den Zügelhilfen.'
  },
  {
    id: 'hi34', twin: 'schenkelhilfen-arten', cat: 'hilfen', level: 'aufbau', type: 'multi',
    q: 'Welche dieser Schenkelhilfen liegen hinter dem Gurt?',
    options: [
      'Vorwärts-seitwärts treibender Schenkel',
      'Verwahrender Schenkel',
      'Vorwärts treibender Schenkel'
    ],
    a: [0, 1],
    explain: 'Der vorwärts treibende Schenkel liegt am Gurt. Vorwärts-seitwärts treibend (innen) und verwahrend (außen) liegen etwa eine Handbreit dahinter.'
  },
  {
    id: 'hi35', cat: 'hilfen', level: 'basis', type: 'text',
    q: 'Welche Hilfengruppe bildet das Bindeglied zwischen treibenden und verhaltenden Hilfen?',
    a: ['Gewichtshilfen', 'Gewichtshilfe', 'Gewicht'],
    explain: 'Die Gewichtshilfen. Sie sind zugleich die wichtigsten Hilfen, weil das Pferd sie immer spürt.'
  }
];
