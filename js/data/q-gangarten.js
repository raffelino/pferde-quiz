// SPDX-License-Identifier: Apache-2.0
// Fragenpool: Grundgangarten – Takt, Phasen, Fußfolge, Tempi und Störungen.
// Fragen mit "hooves" zeigen kleine Fußfolge-Diagramme statt Text.
// Kürzel: VL = vorne links, VR = vorne rechts, HL = hinten links, HR = hinten rechts.

const LEGEND_STAND = 'Ausgefüllte Hufe = Bein mit Bodenkontakt, leere Hufe = Bein in der Luft. Blick von oben, das Pferd läuft nach vorne (oben).';
const LEGEND_STEP = 'Ausgefüllter Huf = Bein, das gerade auffußt. Blick von oben, das Pferd läuft nach vorne (oben).';

export default [
  {
    id: 'gg01', cat: 'gangarten', level: 'basis', type: 'multi',
    q: 'Welche Gangarten sind die Grundgangarten des Pferdes?',
    options: ['Schritt', 'Trab', 'Galopp', 'Tölt', 'Pass'],
    a: [0, 1, 2],
    explain: 'Tölt und Pass sind Spezialgangarten, die nur Gangpferderassen (z. B. Isländer) zeigen. Ziel der Arbeit in den Grundgangarten ist der Erhalt und die Förderung der natürlichen Bewegung – deshalb liegt das Augenmerk auf Takt und Gleichmaß.'
  },
  {
    id: 'gg02', twin: 'takt-und-phasen', cat: 'gangarten', level: 'basis', type: 'match',
    q: 'Ordne jeder Gangart Takt und Phasenzahl zu.',
    pairs: [
      ['Schritt', 'Viertakt in 8 Phasen'],
      ['Trab', 'Zweitakt in 4 Phasen'],
      ['Galopp', 'Dreitakt in 6 Phasen']
    ],
    explain: 'Nur der Schritt hat keine Schwebephase. Trab und Galopp haben jeweils einen Moment der freien Schwebe.'
  },
  {
    id: 'gg03', twin: 'takt-und-phasen', cat: 'gangarten', level: 'aufbau', type: 'number',
    q: 'Aus wie vielen Phasen besteht der Schritt?',
    a: 8, tol: 0, unit: 'Phasen',
    explain: 'Acht Phasen: Es wechseln sich immer eine Dreibeinstütze und eine Zweibeinstütze ab.'
  },
  {
    id: 'gg04', twin: 'takt-und-phasen', cat: 'gangarten', level: 'aufbau', type: 'number',
    q: 'Aus wie vielen Phasen besteht der Galopp?',
    a: 6, tol: 0, unit: 'Phasen',
    explain: 'Sechs Phasen – von der Fußung des äußeren Hinterbeins über Dreibein-, Zweibein- und Einbeinstütze bis zur Schwebephase.'
  },
  {
    id: 'gg05', cat: 'gangarten', level: 'basis', type: 'truefalse',
    q: 'Der Schritt hat keine Schwebephase.',
    a: true,
    explain: 'Im Schritt hat das Pferd immer zwei oder drei Beine am Boden. Deshalb ist der Schritt die Gangart, in der Taktfehler am deutlichsten sichtbar werden.'
  },
  {
    id: 'gg06', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Welche Stützen wechseln sich im Schritt ab?',
    options: [
      'Dreibeinstütze und Zweibeinstütze',
      'Zweibeinstütze und Schwebephase',
      'Einbeinstütze und Dreibeinstütze',
      'Vierbeinstütze und Zweibeinstütze'
    ],
    a: 0,
    explain: 'Die Fußfolge ist dabei nacheinander diagonal und lateral: Auf ein Vorderbein folgt das diagonale Hinterbein, danach das laterale (gleichseitige) Vorderbein.'
  },
  {
    id: 'gg07', cat: 'gangarten', level: 'profi', type: 'order',
    q: 'Bringe die Fußfolge im Schritt in die richtige Reihenfolge. Beginne mit dem Auffußen vorne rechts.',
    legend: LEGEND_STEP,
    items: [
      { label: 'Vorne rechts', hooves: ['VR'] },
      { label: 'Hinten links (diagonal)', hooves: ['HL'] },
      { label: 'Vorne links (lateral)', hooves: ['VL'] },
      { label: 'Hinten rechts (diagonal)', hooves: ['HR'] }
    ],
    explain: 'Der Schritt geht nacheinander diagonal und lateral: Nach vorne rechts kommt das diagonale linke Hinterbein, danach das laterale linke Vorderbein und dann wieder diagonal das rechte Hinterbein.'
  },
  {
    id: 'gg08', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Woran erkennt man einen korrekten Mittelschritt?',
    options: [
      'Die Hinterhufe greifen über die Spur der Vorderhufe hinaus',
      'Die Hinterhufe bleiben deutlich hinter der Spur der Vorderhufe',
      'Die Hinterhufe treten genau in die Spur der Vorderhufe',
      'Das Pferd geht passartig'
    ],
    a: 0,
    explain: 'Der starke Schritt ist noch weiter und raumgreifender als der Mittelschritt. Beim Schritt am langen Zügel darf sich das Pferd zusätzlich dehnen.'
  },
  {
    id: 'gg09', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Der Schritt wird „passartig" – welche Art von Störung ist das?',
    options: [
      'Eine Störung im zeitlichen Gleichmaß',
      'Eine Störung im räumlichen Gleichmaß',
      'Eine Störung der Anlehnung',
      'Gar keine Störung, sondern eine Spezialgangart'
    ],
    a: 0,
    explain: 'Passartiger Schritt stört das zeitliche Gleichmaß, Kurz-Lang-Schreiten das räumliche Gleichmaß. Ursachen sind meist Mängel in Losgelassenheit, Geraderichtung, Koordination, Durchlässigkeit – oder Reiterfehler.'
  },
  {
    id: 'gg10', cat: 'gangarten', level: 'aufbau', type: 'multi',
    q: 'Welche Ursachen können Störungen in den Grundgangarten haben?',
    options: [
      'Mangelnde Losgelassenheit',
      'Fehlende Geraderichtung',
      'Mangelnde Durchlässigkeit',
      'Reiterfehler',
      'Zu großer Auslauf auf der Weide'
    ],
    a: [0, 1, 2, 3],
    explain: 'Dazu kommen Koordinationsprobleme sowie Überforderung in Balance und Tempo. Bewegung auf der Weide ist dagegen die Grundlage gesunder Grundgangarten.'
  },
  {
    id: 'gg11', cat: 'gangarten', level: 'basis', type: 'single',
    q: 'Wie bewegt sich das Pferd im Trab?',
    options: [
      'Schwunghaft im Zweitakt – die diagonalen Beinpaare fußen gleichzeitig',
      'Schreitend im Viertakt ohne Schwebephase',
      'Im Dreitakt mit deutlicher Schwebephase',
      'Lateral im Zweitakt'
    ],
    a: 0,
    explain: 'Zwischen den beiden Zweibeinstützen liegt jeweils ein Augenblick der freien Schwebe – daraus ergeben sich die vier Phasen des Trabes.'
  },
  {
    id: 'gg12', cat: 'gangarten', level: 'aufbau', type: 'order',
    q: 'Bringe die Phasen des Trabes in die richtige Reihenfolge. Beginne mit der Zweibeinstütze vorne links / hinten rechts.',
    legend: LEGEND_STAND,
    items: [
      { label: 'Zweibeinstütze: vorne links und hinten rechts', hooves: ['VL', 'HR'] },
      { label: 'Augenblick der freien Schwebe', hooves: [] },
      { label: 'Zweibeinstütze: vorne rechts und hinten links', hooves: ['VR', 'HL'] }
    ],
    explain: 'Danach folgt erneut ein Augenblick der freien Schwebe – zusammen ergeben sich die vier Phasen des Trabes. Das diagonale Beinpaar fußt dabei gleichzeitig auf und ab.'
  },
  {
    id: 'gg13', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Woran erkennt man einen korrekten Arbeitstrab?',
    options: [
      'Die Hinterhufe fußen mindestens in die Spur der Vorderhufe',
      'Die Hinterhufe bleiben eine Hufbreite dahinter',
      'Das Pferd tritt deutlich über die Spur hinaus und wird schneller',
      'Die Stirn-Nasenlinie liegt hinter der Senkrechten'
    ],
    a: 0,
    explain: 'Beim Tritteverlängern greifen die Hinterbeine weiter durch, der Raumgriff wird größer und die Stirn-Nasenlinie kommt vor die Senkrechte – das Tempo bleibt dabei kontrolliert.'
  },
  {
    id: 'gg14', cat: 'gangarten', level: 'profi', type: 'multi',
    q: 'Welche Fehler zeigen sich typischerweise im Trab?',
    options: [
      'Auflösung des diagonalen Fußens',
      'Ungleiches Vorschwingen der Gliedmaßen',
      'Mangelnde Koordination von Vor- und Hinterhand',
      'Zügellahmheit',
      'Kreuzgalopp'
    ],
    a: [0, 1, 2, 3],
    explain: 'Kreuzgalopp ist ein Fehler im Galopp. Ursachen für Trabfehler sind Reiterfehler, Überforderung in Balance oder Tempo sowie mangelnde Losgelassenheit, Durchlässigkeit und Geraderichtung.'
  },
  {
    id: 'gg15', twin: 'takt-und-phasen', cat: 'gangarten', level: 'basis', type: 'single',
    q: 'In welchem Takt geht das Pferd im Galopp?',
    options: ['Dreitakt', 'Zweitakt', 'Viertakt', 'Fünftakt'],
    a: 0,
    explain: 'Der Galopp ist ein Dreitakt mit klarer Schwebephase, insgesamt sechs Phasen. Wird daraus ein Viertakt (Vierschlag), ist der Takt verloren gegangen.'
  },
  {
    id: 'gg16', twin: 'galopp-fussfolge', cat: 'gangarten', level: 'profi', type: 'order',
    q: 'Bringe die Phasen des Linksgalopps in die richtige Reihenfolge. Beginne mit der Fußung nach der Schwebephase.',
    legend: LEGEND_STAND,
    items: [
      { label: 'Einbeinstütze: äußeres Hinterbein (hinten rechts) fußt', hooves: ['HR'] },
      { label: 'Dreibeinstütze: diagonales Paar hinten links / vorne rechts kommt dazu', hooves: ['HR', 'HL', 'VR'] },
      { label: 'Zweibeinstütze: hinten rechts fußt ab', hooves: ['HL', 'VR'] },
      { label: 'Dreibeinstütze: inneres Vorderbein (vorne links) fußt auf', hooves: ['HL', 'VR', 'VL'] },
      { label: 'Einbeinstütze: diagonales Paar fußt ab, nur vorne links trägt', hooves: ['VL'] },
      { label: 'Schwebephase: vorne links drückt ab', hooves: [] }
    ],
    explain: 'Im Linksgalopp beginnt die Fußfolge mit dem äußeren Hinterbein, dann folgt das diagonale Beinpaar und zuletzt das innere Vorderbein („führendes Bein"), bevor die Schwebephase kommt. Im Rechtsgalopp ist alles spiegelverkehrt.'
  },
  {
    id: 'gg17', twin: 'galopp-fuehrendes-bein', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Welches Bein greift im Linksgalopp am weitesten nach vorne?',
    options: ['Das linke Vorderbein', 'Das rechte Vorderbein', 'Das linke Hinterbein', 'Das rechte Hinterbein'],
    a: 0,
    explain: 'Das innere Vorderbein ist das „führende" Bein und greift am weitesten vor. Daran erkennt man vom Boden und vom Sattel aus, auf welcher Hand galoppiert wird.'
  },
  {
    id: 'gg18', twin: 'galopp-fuehrendes-bein', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Was versteht man unter Handgalopp?',
    options: [
      'Das Pferd galoppiert auf der Hand, auf der es geritten wird – auf der rechten Hand also im Rechtsgalopp',
      'Das Pferd galoppiert mit der Vorhand voran',
      'Der Reiter galoppiert mit einer Hand am Zügel',
      'Ein Galopp mit vier Schlägen'
    ],
    a: 0,
    explain: 'Das Gegenstück ist der Außen- bzw. Kontergalopp: Auf der rechten Hand wird bewusst im Linksgalopp geritten – eine Übung für Geraderichtung und Durchlässigkeit.'
  },
  {
    id: 'gg19', cat: 'gangarten', level: 'aufbau', type: 'multi',
    q: 'Welche Fehler sind typische Störungen im Galopp?',
    options: ['Kreuzgalopp', 'Vierschlag', 'Passartiges Gehen', 'Zügellahmheit'],
    a: [0, 1],
    explain: 'Beim Kreuzgalopp springt das Pferd vorne und hinten auf unterschiedlicher Hand, beim Vierschlag zerfällt der Dreitakt. Ursachen: Spannung, Mängel in der Rückentätigkeit, Koordinations- und Balanceverlust sowie fehlender Fleiß.'
  },
  {
    id: 'gg20', cat: 'gangarten', level: 'aufbau', type: 'single',
    q: 'Wie soll ein korrekter Arbeitsgalopp aussehen?',
    options: [
      'Schwungvoll, bergauf und taktmäßig mit klarer Schwebephase',
      'Flach und eilig mit kurzen Sprüngen',
      'Möglichst schnell mit langem Rahmen',
      'Ohne Schwebephase, dafür sehr ruhig'
    ],
    a: 0,
    explain: 'Beim Sprüngeverlängern wird der Raumgriff erweitert, der Takt und die Bergauftendenz bleiben erhalten – das Tempo allein macht keinen besseren Galopp.'
  },
  {
    id: 'gg21', cat: 'gangarten', level: 'basis', type: 'text',
    q: 'Wie heißt der Moment, in dem sich kein Huf am Boden befindet?',
    a: ['Schwebephase', 'Schwebe', 'freie Schwebe'],
    explain: 'Trab und Galopp haben eine Schwebephase, der Schritt nicht. Sie ist das, was diese Gangarten „schwungvoll" macht.'
  },
  {
    id: 'gg22', cat: 'gangarten', level: 'profi', type: 'multi',
    q: 'Welche Tempi gibt es innerhalb einer Gangart?',
    options: [
      'Arbeitstempo',
      'Mitteltempo',
      'Starkes Tempo',
      'Versammeltes Tempo',
      'Wettkampftempo'
    ],
    a: [0, 1, 2, 3],
    explain: 'Ein Tempowechsel innerhalb einer Gangart bedeutet: Der Raumgriff verändert sich, Takt und Gleichmaß bleiben erhalten. Verkürzen heißt nicht langsamer trippeln, verlängern nicht schneller rennen.'
  },
  {
    id: 'gg23', cat: 'gangarten', level: 'aufbau', type: 'truefalse',
    q: 'Beim Verlängern der Tritte soll die Stirn-Nasenlinie vor die Senkrechte kommen.',
    a: true,
    explain: 'Das Pferd darf sich dabei etwas mehr dehnen und den Rahmen erweitern, während die Hinterbeine weiter durchschwingen.'
  },
  {
    id: 'gg24', cat: 'gangarten', level: 'basis', type: 'single',
    q: 'Was ist das Ziel der Arbeit in den Grundgangarten?',
    options: [
      'Erhalt und Förderung der natürlichen Bewegung mit Takt und Gleichmaß',
      'Möglichst hohe Geschwindigkeit',
      'Möglichst spektakuläre Knieaktion',
      'Möglichst frühe Versammlung'
    ],
    a: 0,
    explain: 'Alles Weitere baut darauf auf: Ohne Takt und Gleichmaß gibt es keine Losgelassenheit – und damit keine Ausbildung nach der Skala.'
  },
  {
    id: 'gg25', twin: 'galopp-fussfolge', cat: 'gangarten', level: 'profi', type: 'single',
    q: 'Welche Stütze zeigt das Pferd im Galopp unmittelbar nach der Schwebephase?',
    options: [
      'Einbeinstütze auf dem äußeren Hinterbein',
      'Zweibeinstütze auf dem diagonalen Beinpaar',
      'Dreibeinstütze',
      'Einbeinstütze auf dem inneren Vorderbein'
    ],
    a: 0,
    explain: 'Das äußere Hinterbein fängt den ganzen Galoppsprung allein ab – deshalb ist die Galopparbeit für die Hinterhand so anstrengend und braucht gute Vorbereitung.'
  }
];
