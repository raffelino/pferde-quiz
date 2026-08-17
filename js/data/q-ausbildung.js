// SPDX-License-Identifier: Apache-2.0
// Fragenpool: Ausbildungsweg des Reiters und Skala der Ausbildung des Pferdes.
// Der Typ "pyramid" zeigt eine leere Pyramide, deren Stufen von unten nach oben
// einsortiert werden müssen. "given" markiert bereits vorgegebene Stufen.

const REITER = [
  'Gleichgewicht',
  'Losgelassenheit',
  'Eingehen in die Bewegung',
  'Hilfengebung',
  'Zusammenwirken der Hilfen'
];

const PFERD = [
  'Takt',
  'Losgelassenheit',
  'Anlehnung',
  'Schwung',
  'Geraderichtung',
  'Versammlung'
];

export default [
  {
    id: 'aus01', twin: 'reiterweg-reihenfolge', cat: 'ausbildung', level: 'basis', type: 'pyramid',
    q: 'Baue den Ausbildungsweg des Reiters auf – von der untersten Stufe bis zur Spitze.',
    caption: 'Ausbildungsweg des Reiters',
    levels: REITER,
    groups: [
      { from: 0, to: 2, label: '1. Entwicklung des Sitzes' },
      { from: 3, to: 4, label: '2. Entwicklung der Einwirkung' }
    ],
    side: 'Entwicklung des Gefühls',
    explain: 'Die ersten drei Stufen bilden die Entwicklung des Sitzes, die beiden oberen die Entwicklung der Einwirkung. Parallel dazu entwickelt sich über den gesamten Weg hinweg das Gefühl.'
  },
  {
    id: 'aus02', twin: 'skala-reihenfolge', cat: 'ausbildung', level: 'aufbau', type: 'pyramid',
    q: 'Baue die Skala der Ausbildung des Pferdes auf – von der untersten Stufe bis zur Spitze.',
    caption: 'Skala der Ausbildung',
    levels: PFERD,
    explain: 'Takt, Losgelassenheit und Anlehnung bilden die Gewöhnungsphase, Schwung und Geraderichtung die Entwicklung der Schubkraft, die Versammlung steht für die Tragkraft. Die Punkte greifen ineinander – ohne Takt keine Losgelassenheit, ohne Losgelassenheit keine echte Anlehnung.'
  },
  {
    id: 'aus03', twin: 'reiterweg-reihenfolge', cat: 'ausbildung', level: 'aufbau', type: 'pyramid',
    q: 'Ergänze die fehlenden Stufen im Ausbildungsweg des Reiters.',
    caption: 'Ausbildungsweg des Reiters',
    levels: REITER,
    given: [0, 3],
    explain: 'Auf dem Gleichgewicht baut die Losgelassenheit des Reiters auf, danach das Eingehen in die Bewegung. Erst dann folgen Hilfengebung und das Zusammenwirken der Hilfen.'
  },
  {
    id: 'aus04', twin: 'skala-reihenfolge', cat: 'ausbildung', level: 'profi', type: 'pyramid',
    q: 'Ergänze die fehlenden Punkte der Skala der Ausbildung.',
    caption: 'Skala der Ausbildung',
    levels: PFERD,
    given: [0, 3],
    explain: 'Zwischen Takt und Schwung liegen Losgelassenheit und Anlehnung, darüber folgen Geraderichtung und Versammlung.'
  },
  {
    id: 'aus05', cat: 'ausbildung', level: 'aufbau', type: 'single',
    q: 'Mit welcher Stufe beginnt der Ausbildungsweg des Reiters?',
    options: ['Gleichgewicht', 'Losgelassenheit', 'Hilfengebung', 'Zusammenwirken der Hilfen'],
    a: 0,
    explain: 'Ohne Gleichgewicht klammert sich der Reiter am Zügel oder mit den Schenkeln fest – eine unabhängige Hilfengebung ist dann unmöglich.'
  },
  {
    id: 'aus06', twin: 'reiterweg-reihenfolge', cat: 'ausbildung', level: 'aufbau', type: 'single',
    q: 'Welche Stufe steht im Ausbildungsweg des Reiters direkt über der Losgelassenheit?',
    options: ['Eingehen in die Bewegung', 'Gleichgewicht', 'Hilfengebung', 'Zusammenwirken der Hilfen'],
    a: 0,
    explain: 'Reihenfolge von unten nach oben: Gleichgewicht – Losgelassenheit – Eingehen in die Bewegung – Hilfengebung – Zusammenwirken der Hilfen.'
  },
  {
    id: 'aus07', cat: 'ausbildung', level: 'aufbau', type: 'match',
    q: 'Ordne jede Stufe des Reiters dem richtigen Ausbildungsabschnitt zu.',
    pairs: [
      ['Gleichgewicht', 'Entwicklung des Sitzes'],
      ['Eingehen in die Bewegung', 'Entwicklung des Sitzes'],
      ['Hilfengebung', 'Entwicklung der Einwirkung'],
      ['Zusammenwirken der Hilfen', 'Entwicklung der Einwirkung']
    ],
    explain: 'Gleichgewicht, Losgelassenheit und Eingehen in die Bewegung gehören zur Entwicklung des Sitzes. Hilfengebung und Zusammenwirken der Hilfen bilden die Entwicklung der Einwirkung.'
  },
  {
    id: 'aus08', cat: 'ausbildung', level: 'basis', type: 'truefalse',
    q: 'Der Reiter lernt zuerst die Hilfengebung und arbeitet danach an seinem Sitz.',
    a: false,
    explain: 'Genau umgekehrt: Erst der Sitz (Gleichgewicht, Losgelassenheit, Eingehen in die Bewegung), dann die Einwirkung (Hilfengebung, Zusammenwirken der Hilfen).'
  },
  {
    id: 'aus09', cat: 'ausbildung', level: 'aufbau', type: 'single',
    q: 'Was entwickelt sich beim Reiter über den gesamten Ausbildungsweg hinweg parallel mit?',
    options: ['Das Gefühl', 'Die Kraft', 'Die Ausdauer', 'Die Beweglichkeit der Hände'],
    a: 0,
    explain: 'Im Schaubild läuft der Pfeil „Entwicklung des Gefühls" neben der gesamten Pyramide nach oben – Reitgefühl entsteht auf jeder Stufe mit.'
  },
  {
    id: 'aus10', cat: 'ausbildung', level: 'aufbau', type: 'single',
    q: 'Warum werden Ausbildungsweg und Ausbildungsskala als Pyramide dargestellt?',
    options: [
      'Weil jede Stufe auf der darunterliegenden aufbaut und ohne sie keinen Bestand hat',
      'Weil die oberen Stufen am wichtigsten sind',
      'Weil die Ausbildung immer schneller wird',
      'Weil es genau fünf Stufen sind'
    ],
    a: 0,
    explain: 'Fehlt eine untere Stufe, wackelt alles darüber. Deshalb geht man in der Ausbildung bei Problemen immer eine Stufe zurück, statt an der Spitze weiterzuarbeiten.'
  },
  {
    id: 'aus11', cat: 'ausbildung', level: 'aufbau', type: 'multi',
    q: 'Welche Punkte der Ausbildungsskala bilden die Gewöhnungsphase?',
    options: ['Takt', 'Losgelassenheit', 'Anlehnung', 'Schwung', 'Versammlung'],
    a: [0, 1, 2],
    explain: 'Gewöhnungsphase: Takt, Losgelassenheit, Anlehnung. Danach folgen die Entwicklung der Schubkraft (Schwung, Geraderichtung) und der Tragkraft (Versammlung).'
  },
  {
    id: 'aus12', cat: 'ausbildung', level: 'aufbau', type: 'text',
    q: 'Wie heißt der oberste Punkt der Skala der Ausbildung?',
    a: ['Versammlung'],
    explain: 'Die Versammlung setzt alle vorherigen Punkte voraus: Das Pferd nimmt vermehrt Last auf die Hinterhand auf, die Hanken beugen sich, der Rahmen wird kürzer und höher.'
  },
  {
    id: 'aus13', twin: 'skala-reihenfolge', cat: 'ausbildung', level: 'profi', type: 'order',
    q: 'Bringe die Punkte der Skala der Ausbildung in die richtige Reihenfolge.',
    items: PFERD,
    explain: 'Takt – Losgelassenheit – Anlehnung – Schwung – Geraderichtung – Versammlung. Die Skala gilt für die tägliche Arbeit genauso wie für die gesamte Ausbildung eines Pferdes.'
  },
  {
    id: 'aus14', cat: 'ausbildung', level: 'profi', type: 'single',
    q: 'Was bedeutet die Stufe „Eingehen in die Bewegung" beim Reiter?',
    options: [
      'Der Reiter lässt die Bewegung des Pferdes zu und schwingt geschmeidig mit',
      'Der Reiter treibt bei jedem Tritt aktiv mit dem Oberkörper',
      'Der Reiter geht in den leichten Sitz',
      'Der Reiter beginnt mit Seitengängen'
    ],
    a: 0,
    explain: 'Erst wenn der Reiter die Bewegung zulässt statt sie zu blockieren, kann er gezielt einwirken – deshalb steht diese Stufe direkt vor der Hilfengebung.'
  },
  {
    id: 'aus15', cat: 'ausbildung', level: 'profi', type: 'truefalse',
    q: '„Losgelassenheit" kommt sowohl im Ausbildungsweg des Reiters als auch in der Skala der Ausbildung des Pferdes vor.',
    a: true,
    explain: 'Beim Reiter ist sie die zweite Stufe nach dem Gleichgewicht, beim Pferd der zweite Punkt nach dem Takt. Verspannt sich einer von beiden, überträgt sich das sofort auf den anderen.'
  }
];
