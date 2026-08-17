// SPDX-License-Identifier: Apache-2.0
// Fragenpool: Longieren & Bodenarbeit, Sicherheit/Ausreiten/Recht, Turnier, Zucht & Aufzucht

export default [

  /* ------------------------------------------------------- LONGIEREN */
  {
    id: 'lo01', cat: 'longieren', level: 'aufbau', type: 'multi',
    q: 'Welche Ausrüstung trägt der Longenführer aus Sicherheitsgründen?',
    options: ['Handschuhe', 'Festes Schuhwerk', 'Reithelm', 'Longierpeitsche in der zur Bewegungsrichtung passenden Hand', 'Sporen'],
    a: [0, 1, 2, 3],
    explain: 'Handschuhe schützen vor Verbrennungen durch die Longe, feste Schuhe vor Tritten. Die Longe wird nie um die Hand gewickelt, sondern in gleich großen Schlaufen gehalten.'
  },
  {
    id: 'lo02', cat: 'longieren', level: 'aufbau', type: 'single',
    q: 'Welche Position nimmt der Longenführer zum Pferd ein?',
    options: [
      'Er bildet mit Longe, Peitsche und Pferd ein Dreieck und bleibt auf Höhe der Gurtlage',
      'Er steht genau vor dem Pferd',
      'Er läuft direkt hinter dem Pferd her',
      'Er steht am Bahnrand'
    ],
    a: 0,
    explain: 'Die Longe zeigt zum Pferdekopf, die Peitsche zur Hinterhand – der Longenführer bleibt in der Mitte des Zirkels leicht hinter der Schulterlinie („Dreieck").'
  },
  {
    id: 'lo03', cat: 'longieren', level: 'aufbau', type: 'number',
    q: 'Wie groß sollte der Longierzirkel mindestens im Durchmesser sein (in Metern)?',
    a: 15, tol: 3, unit: 'm',
    explain: 'Mindestens etwa 15 m, besser 18–20 m. Zu enge Zirkel belasten Gelenke und Sehnen erheblich, besonders bei jungen Pferden.'
  },
  {
    id: 'lo04', cat: 'longieren', level: 'profi', type: 'truefalse',
    q: 'Hilfszügel wie Ausbinder werden erst nach der Aufwärmphase und zunächst lang verschnallt.',
    a: true,
    explain: 'Zuerst mindestens 10 Minuten ohne bzw. mit langen Ausbindern im Schritt lösen. Hilfszügel nie am stehenden, angebundenen Pferd anlassen und nie zu kurz verschnallen.'
  },
  {
    id: 'lo05', cat: 'longieren', level: 'aufbau', type: 'single',
    q: 'Warum wird beim Longieren regelmäßig die Hand gewechselt?',
    options: [
      'Um beide Körperseiten des Pferdes gleichmäßig zu belasten',
      'Damit der Longenführer sich nicht langweilt',
      'Weil die Longe sonst verschleißt',
      'Damit das Pferd schneller wird'
    ],
    a: 0,
    explain: 'Einseitige Belastung führt zu Verspannungen und Schiefe. Die Gesamtdauer sollte je nach Trainingsstand rund 20–30 Minuten nicht überschreiten.'
  },
  {
    id: 'lo06', cat: 'longieren', level: 'basis', type: 'multi',
    q: 'Welche Ziele hat Bodenarbeit?',
    options: [
      'Verbesserung von Vertrauen und Kommunikation',
      'Gymnastizierung ohne Reitergewicht',
      'Gewöhnung an Umweltreize',
      'Kontrolle des Pferdes vom Boden aus',
      'Ersatz für die tierärztliche Versorgung'
    ],
    a: [0, 1, 2, 3],
    explain: 'Bodenarbeit ist Ausbildung, kein Ersatz für Tierarzt oder Hufschmied. Sinnvolle Übungen: Führtraining, Rückwärtsrichten, Weichen auf Hilfen, Gelassenheitstraining.'
  },
  {
    id: 'lo07', cat: 'longieren', level: 'profi', type: 'single',
    q: 'Welches Ausrüstungsteil ermöglicht besonders gebisslose Longenarbeit?',
    options: ['Kappzaum', 'Kandare', 'Martingal', 'Sperrriemen'],
    a: 0,
    explain: 'Der Kappzaum wirkt über den Nasenrücken und schont das Pferdemaul. Wird an der Trense longiert, wird die Longe korrekt verschnallt und nie direkt in einen Trensenring eingehängt und über den Kopf geführt.'
  },
  {
    id: 'lo08', cat: 'longieren', level: 'basis', type: 'truefalse',
    q: 'Die Longe darf zum besseren Halt um die Hand gewickelt werden.',
    a: false,
    explain: 'Niemals! Bei einem Losreißen droht schwerste Handverletzung. Die Longe wird in gleichmäßigen Schlaufen aufgenommen und locker gehalten.'
  },

  /* ---------------------------------------- SICHERHEIT & AUSREITEN */
  {
    id: 'si01', cat: 'sicherheit', level: 'basis', type: 'multi',
    q: 'Welche Ausrüstung gehört zur Sicherheit des Reiters?',
    options: [
      'Reithelm nach aktueller Norm',
      'Feste Schuhe mit Absatz oder Stiefel',
      'Sicherheits- bzw. Schutzweste beim Springen und im Gelände',
      'Handschuhe',
      'Lose Turnschuhe'
    ],
    a: [0, 1, 2, 3],
    explain: 'Der Helm muss richtig sitzen, mit geschlossenem Kinnriemen getragen und nach einem Sturz ausgetauscht werden. Schuhe brauchen Absatz oder es werden Sicherheitssteigbügel genutzt.'
  },
  {
    id: 'si02', cat: 'sicherheit', level: 'aufbau', type: 'truefalse',
    q: 'Reiter gelten im Straßenverkehr als Verkehrsteilnehmer und müssen sich an die StVO halten.',
    a: true,
    explain: 'Reiter unterliegen der StVO (§ 28). Sie reiten auf der rechten Fahrbahnseite, dürfen Gehwege nicht nutzen und müssen Handzeichen geben. Reitwege sind zu benutzen, wo vorhanden.'
  },
  {
    id: 'si03', cat: 'sicherheit', level: 'aufbau', type: 'multi',
    q: 'Was ist beim Ausreiten in der Dämmerung zu beachten?',
    options: [
      'Reflektierende Kleidung bzw. Warnweste tragen',
      'Beleuchtung mitführen (z. B. Steigbügellicht/Leuchte)',
      'Reflektoren an Pferd und Ausrüstung anbringen',
      'Bekannte Wege wählen und jemandem Bescheid geben',
      'Möglichst im Galopp auf der Straße unterwegs sein'
    ],
    a: [0, 1, 2, 3],
    explain: 'Sichtbarkeit rettet Leben. Auf der Straße wird Schritt geritten; Handy und Angaben zum Streckenverlauf gehören zur Grundausstattung.'
  },
  {
    id: 'si04', cat: 'sicherheit', level: 'basis', type: 'single',
    q: 'Wie verhält man sich, wenn ein Auto beim Ausreiten von hinten naht?',
    options: [
      'Ruhig bleiben, Schritt reiten, ggf. Handzeichen zum Langsamfahren geben und am rechten Rand bleiben',
      'Sofort antraben, um schneller vorbeizukommen',
      'In der Straßenmitte bleiben, damit man gesehen wird',
      'Absteigen und das Pferd auf die Fahrbahnmitte stellen'
    ],
    a: 0,
    explain: 'Deutliche Handzeichen und Blickkontakt zum Fahrer helfen. Bei unsicheren Pferden in eine Einfahrt ausweichen oder absteigen und das Pferd sichern.'
  },
  {
    id: 'si05', cat: 'sicherheit', level: 'aufbau', type: 'single',
    q: 'Ab welcher Gruppengröße gilt eine Reitergruppe im Straßenverkehr als geschlossener Verband?',
    options: ['Ab 16 Reitern', 'Ab 4 Reitern', 'Ab 8 Reitern', 'Ab 30 Reitern'],
    a: 0,
    explain: 'Ein geschlossener Verband ab 16 Reitern gilt verkehrsrechtlich als ein Fahrzeug und muss entsprechend gekennzeichnet und geführt werden.'
  },
  {
    id: 'si06', cat: 'sicherheit', level: 'basis', type: 'multi',
    q: 'Welche Regeln gelten für das Ausreiten in der Gruppe?',
    options: [
      'Tempo gemeinsam absprechen und ansagen',
      'Ausreichend Abstand halten',
      'Auf das schwächste Pferd-Reiter-Paar Rücksicht nehmen',
      'Nicht ohne Vorwarnung überholen oder anhalten',
      'Wer zuerst am Waldrand ist, gibt das Tempo vor'
    ],
    a: [0, 1, 2, 3],
    explain: 'Tempowechsel werden angekündigt und gemeinsam geritten. Ein erfahrenes Pferd führt, unsichere Pferde reiten in der Mitte.'
  },
  {
    id: 'si07', cat: 'sicherheit', level: 'profi', type: 'truefalse',
    q: 'Im Wald darf grundsätzlich überall frei geritten werden.',
    a: false,
    explain: 'Das Reiten im Wald regeln die Landeswaldgesetze – meist ist es nur auf Wegen bzw. gekennzeichneten Reitwegen erlaubt. In einigen Bundesländern ist eine Reitplakette/Kennzeichnung Pflicht.'
  },
  {
    id: 'si08', cat: 'sicherheit', level: 'aufbau', type: 'multi',
    q: 'Was ist beim Pferdetransport zu beachten?',
    options: [
      'Transportgamaschen oder Bandagen und ggf. Kopfschutz anlegen',
      'Anhänger und Boden vor der Fahrt kontrollieren',
      'Pferd sicher, aber mit ausreichend Bewegungsfreiheit anbinden',
      'Ruhig und vorausschauend fahren, Pausen einplanen',
      'Pferd mit dem Führstrick fest am Panikhaken verknoten, ohne Sicherheitsknoten'
    ],
    a: [0, 1, 2, 3],
    explain: 'Beim Transport gehören Papiere (Equidenpass) mit ins Fahrzeug. Angebunden wird mit Sicherheitsknoten oder Panikhaken – nie starr.'
  },
  {
    id: 'si09', cat: 'sicherheit', level: 'basis', type: 'single',
    q: 'Was tut man zuerst, wenn ein Reiter gestürzt ist und regungslos liegt?',
    options: [
      'Unfallstelle sichern, Pferd sichern lassen, Notruf 112 absetzen und die Person nicht unnötig bewegen',
      'Den Reiter sofort aufsetzen',
      'Den Helm sofort abnehmen',
      'Warten, ob er von allein aufsteht'
    ],
    a: 0,
    explain: 'Erste Hilfe wie bei jedem Unfall: Sicherheit, Notruf, Betreuung. Der Helm wird nur abgenommen, wenn es zur Atemwegssicherung nötig ist – und dann möglichst zu zweit.'
  },
  {
    id: 'si10', cat: 'sicherheit', level: 'profi', type: 'single',
    q: 'Warum sollte der Steigbügel zur Fußbreite passen bzw. ein Sicherheitssteigbügel genutzt werden?',
    options: [
      'Damit der Fuß bei einem Sturz nicht im Bügel hängen bleibt und der Reiter geschleift wird',
      'Damit der Bügel schöner aussieht',
      'Damit die Bügel nicht klappern',
      'Damit der Sattel besser sitzt'
    ],
    a: 0,
    explain: 'Etwa 1–1,5 cm Platz beidseits des Stiefels. Zu enge oder zu weite Bügel sind lebensgefährlich. Vor dem Absitzen die Bügel hochschieben, damit sie nicht hängen bleiben.'
  },

  /* ---------------------------------------------------------- TURNIER */
  {
    id: 'tu01', cat: 'turnier', level: 'aufbau', type: 'order',
    q: 'Bringe die Leistungsklassen der Prüfungen von leicht nach schwer in die richtige Reihenfolge.',
    items: ['E – Einsteiger', 'A – Anfänger', 'L – Leicht', 'M – Mittel', 'S – Schwer'],
    explain: 'Die Klassen bauen aufeinander auf. In Dressur und Springen gibt es zusätzlich Unterteilungen (z. B. A*, A**, M*, S*).'
  },
  {
    id: 'tu02', cat: 'turnier', level: 'aufbau', type: 'single',
    q: 'Welche Kopfbedeckung ist in Springprüfungen vorgeschrieben?',
    options: [
      'Reithelm mit Dreipunktbefestigung',
      'Zylinder',
      'Melone',
      'Keine Vorschrift'
    ],
    a: 0,
    explain: 'In allen Springprüfungen sowie generell für Reiter unter 18 Jahren ist ein Reithelm mit Dreipunkt-Befestigung Pflicht – auch beim Abreiten.'
  },
  {
    id: 'tu03', cat: 'turnier', level: 'profi', type: 'single',
    q: 'Wie lang darf die Gerte in Springprüfungen maximal sein?',
    options: ['75 cm', '120 cm', '100 cm', 'Unbegrenzt'],
    a: 0,
    explain: 'In Springprüfungen max. 75 cm, in Dressurprüfungen max. 120 cm (in Prüfungen, in denen die Gerte erlaubt ist). Details regelt die jeweils gültige LPO.'
  },
  {
    id: 'tu04', cat: 'turnier', level: 'aufbau', type: 'multi',
    q: 'Was zählt in einer Springprüfung als Fehler?',
    options: [
      'Abwurf einer Hindernisstange',
      'Verweigerung',
      'Überschreiten der erlaubten Zeit',
      'Sturz von Pferd oder Reiter',
      'Ein zu weiter Galoppsprung'
    ],
    a: [0, 1, 2, 3],
    explain: 'Ein Abwurf zählt 4 Fehlerpunkte, die erste Verweigerung 4 Fehlerpunkte, Zeitüberschreitung wird anteilig berechnet. Sturz und die zweite Verweigerung führen zum Ausscheiden.'
  },
  {
    id: 'tu05', cat: 'turnier', level: 'aufbau', type: 'truefalse',
    q: 'Vor dem Start muss der Springparcours zu Fuß besichtigt werden, um Weg, Distanzen und Reihenfolge festzulegen.',
    a: true,
    explain: 'Beim Parcoursbegehen prüft man Nummerierung, Fahnen (rot rechts, weiß links), Distanzen zwischen Hindernissen und den optimalen Weg.'
  },
  {
    id: 'tu06', cat: 'turnier', level: 'basis', type: 'single',
    q: 'Auf welcher Seite muss die rote Fahne eines Hindernisses stehen?',
    options: ['Rechts', 'Links', 'Beliebig', 'In der Mitte'],
    a: 0,
    explain: 'Merksatz: „Rot rechts". Weiße Begrenzung links – auch beim Ein- und Ausreiten in Geländestrecken.'
  },
  {
    id: 'tu07', cat: 'turnier', level: 'profi', type: 'single',
    q: 'Wie werden Dressurlektionen bewertet?',
    options: [
      'Mit Wertnoten von 0 bis 10, bei Bedarf in halben Punkten',
      'Mit Schulnoten von 1 bis 6',
      'Nur mit Fehlerpunkten',
      'Nach Zeit'
    ],
    a: 0,
    explain: '10 = ausgezeichnet, 6 = befriedigend, 0 = nicht ausgeführt. In Aufgaben mit Einzelnoten kommen Gesamtnoten (Grundgangarten, Sitz und Einwirkung, Durchlässigkeit) hinzu.'
  },
  {
    id: 'tu08', cat: 'turnier', level: 'aufbau', type: 'multi',
    q: 'Was gehört zur fairen und regelkonformen Turniervorbereitung?',
    options: [
      'Rechtzeitige Nennung nach Ausschreibung',
      'Gültiger Impfschutz und Equidenpass',
      'Korrekte, regelkonforme Ausrüstung',
      'Faires Abreiten mit Rücksicht auf andere',
      'Ausrüstung erst auf dem Abreiteplatz zusammensuchen'
    ],
    a: [0, 1, 2, 3],
    explain: 'Die Ausschreibung nennt Prüfungen, Nennungsschluss, Teilnahmebedingungen und Anforderungen. Auf dem Abreiteplatz gilt links an links und Rücksichtnahme.'
  },
  {
    id: 'tu09', cat: 'turnier', level: 'profi', type: 'truefalse',
    q: 'Im Turniersport gilt das Wohl des Pferdes als oberstes Gebot („Horse First").',
    a: true,
    explain: 'Die Ethischen Grundsätze des Pferdefreundes und die LPO stellen das Wohl des Pferdes über sportlichen Erfolg. Erschöpfte, lahme oder verletzte Pferde dürfen nicht starten.'
  },
  {
    id: 'tu10', cat: 'turnier', level: 'basis', type: 'single',
    q: 'Wie verhält man sich als Zuschauer am Rand eines Turnierplatzes?',
    options: [
      'Ruhig verhalten, nicht ins Bild springen, Hunde anleinen',
      'Laut anfeuern, während ein Paar in der Dressuraufgabe ist',
      'Regenschirme plötzlich aufspannen',
      'Nah an den Zaun treten und das Pferd anfassen'
    ],
    a: 0,
    explain: 'Plötzliche Bewegungen und Geräusche erschrecken Pferde. Applaus erst nach dem Schlussgruß bzw. nach der Runde.'
  },

  /* ------------------------------------------------ ZUCHT & AUFZUCHT */
  {
    id: 'zu01', cat: 'zucht', level: 'aufbau', type: 'number',
    q: 'Wie viele Monate dauert die Trächtigkeit einer Stute ungefähr?',
    a: 11, tol: 0.5, unit: 'Monate',
    explain: 'Rund 11 Monate bzw. etwa 330–340 Tage. Fohlen kommen meist im Frühjahr zur Welt, damit sie in der Weidesaison aufwachsen.'
  },
  {
    id: 'zu02', cat: 'zucht', level: 'profi', type: 'single',
    q: 'In welchem Abstand tritt bei der Stute in der Decksaison typischerweise die Rosse auf?',
    options: ['Etwa alle 21 Tage', 'Etwa alle 7 Tage', 'Etwa alle 60 Tage', 'Nur einmal im Jahr'],
    a: 0,
    explain: 'Der Zyklus dauert im Mittel 21 Tage; die Rosse selbst etwa 5–7 Tage. Stuten sind saisonal polyöstrisch – vor allem im Frühjahr und Sommer.'
  },
  {
    id: 'zu03', cat: 'zucht', level: 'aufbau', type: 'truefalse',
    q: 'Das Fohlen sollte innerhalb der ersten Lebensstunden die erste Milch (Kolostrum) aufnehmen.',
    a: true,
    explain: 'Das Kolostrum enthält lebenswichtige Antikörper. Es sollte möglichst innerhalb der ersten 2–4 Stunden aufgenommen werden – später kann der Darm die Antikörper nicht mehr aufnehmen.'
  },
  {
    id: 'zu04', cat: 'zucht', level: 'aufbau', type: 'single',
    q: 'Wann werden Fohlen üblicherweise abgesetzt?',
    options: ['Mit etwa 6 Monaten', 'Mit 2 Monaten', 'Mit 12 Monaten', 'Mit 3 Wochen'],
    a: 0,
    explain: 'Üblich ist das Absetzen im Alter von rund 6 Monaten, möglichst stressarm und in Gesellschaft anderer Absetzer.'
  },
  {
    id: 'zu05', cat: 'zucht', level: 'profi', type: 'single',
    q: 'Woran kann man das Alter eines Pferdes grob abschätzen?',
    options: [
      'Am Gebiss (Zahnwechsel, Kunden, Zahnform und -winkel)',
      'An der Fellfarbe',
      'An der Größe',
      'An der Mähnenlänge'
    ],
    a: 0,
    explain: 'Der Zahnwechsel von Milch- zu Dauerzähnen ist mit etwa 5 Jahren abgeschlossen. Danach helfen Kunden, Zahnform und Zahnwinkel – die Schätzung wird mit zunehmendem Alter ungenauer.'
  },
  {
    id: 'zu06', cat: 'zucht', level: 'basis', type: 'match',
    q: 'Ordne die Begriffe richtig zu.',
    pairs: [
      ['Stute', 'Weibliches Pferd'],
      ['Hengst', 'Männliches, unkastriertes Pferd'],
      ['Wallach', 'Kastriertes männliches Pferd'],
      ['Jährling', 'Einjähriges Pferd']
    ],
    explain: 'Weitere Begriffe: Fohlen (im ersten Lebensjahr), Absetzer, Stutfohlen und Hengstfohlen.'
  },
  {
    id: 'zu07', cat: 'zucht', level: 'profi', type: 'multi',
    q: 'Was ist bei der Aufzucht von Jungpferden wichtig?',
    options: [
      'Viel freie Bewegung auf der Weide',
      'Aufwachsen in einer Gruppe Gleichaltriger',
      'Bedarfsgerechte Fütterung mit Mineralstoffversorgung',
      'Regelmäßige Hufkontrolle und Gewöhnung an den Menschen',
      'Möglichst frühes intensives Training unter dem Sattel'
    ],
    a: [0, 1, 2, 3],
    explain: 'Das Skelett ist erst mit etwa 5–6 Jahren voll ausgereift. Zu frühe oder zu intensive Belastung schädigt Gelenke und Wachstumsfugen dauerhaft.'
  },
  {
    id: 'zu08', cat: 'zucht', level: 'aufbau', type: 'single',
    q: 'Was versteht man unter einem Körung bzw. einer Stutbuchaufnahme?',
    options: [
      'Die Zuchtzulassung eines Hengstes bzw. die Eintragung einer Stute in ein Zuchtbuch',
      'Ein Turnier für Jungpferde',
      'Die tierärztliche Untersuchung vor dem Verkauf',
      'Die Ausbildung des Fohlens'
    ],
    a: 0,
    explain: 'Zuchtverbände beurteilen Exterieur, Bewegung, Gesundheit und Abstammung. Nur gekörte Hengste bzw. eingetragene Stuten liefern Nachkommen mit vollem Zuchtbuchstatus.'
  }
];
